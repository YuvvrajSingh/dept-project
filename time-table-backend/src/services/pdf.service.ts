import puppeteer from 'puppeteer';
import { prisma } from '../prisma/client';
import { timetableService } from './timetable.service';
import { AppError } from '../utils/AppError';

export const pdfService = {
  async generateTimetablePdf(classSectionId: number): Promise<Buffer> {
    // 1. Fetch data
    const data = await timetableService.getClassTimetable(classSectionId);
    
    // Fetch subject details for this class
    const classSubjects = await prisma.classSubject.findMany({
      where: { classSectionId },
      include: {
        subject: {
          include: {
            teacherSubjects: {
              include: {
                teacher: true,
              }
            }
          }
        }
      }
    });

    // 2. Build Dynamic Rows for Timetable Group
    let dynamicRows = '';
    const days = ['1', '2', '3', '4', '5', '6'];
    const timeSlots = ['1', '2', '3', '4', '5', '6'];
    
    let isFirstRow = true;
    for (const day of days) {
      const dayData = data.timetable[day];
      if (!dayData) continue;
      
      let rowHtml = `<tr><td><strong>${dayData.label}</strong></td>`;
      
      for (const slotKey of timeSlots) {
        const cell = dayData.slots[slotKey];
        if (!cell) {
          rowHtml += `<td></td>`;
        } else if (cell.type === 'THEORY') {
          rowHtml += `
            <td>
              <div><strong>${cell.subjectCode}</strong></div>
              <div>${cell.teacherAbbr || ''} ${cell.roomName ? `(${cell.roomName})` : ''}</div>
            </td>`;
        } else if (cell.type === 'LAB') {
          // Lab groups
          const groupKeys = Object.keys(cell.groups).sort();
          const groupsHtml = groupKeys.map(k => {
            const g = cell.groups[k];
            return `<div style="font-size: 10px;">${k}: ${g.subjectCode} (${g.lab}) - ${g.teacher}</div>`;
          }).join('');
          
          rowHtml += `<td colspan="2">${groupsHtml}</td>`;
        } else if (cell.type === 'LAB_CONTINUATION') {
          // Do nothing, the previous cell has colspan="2"
        }

        // Add Lunch Break column after Slot 3 (12:00-12:45)
        if (slotKey === '3') {
          if (isFirstRow) {
            rowHtml += `<td rowspan="6" style="writing-mode: vertical-lr; text-align: center; font-weight: bold; letter-spacing: 4px; background-color: #f2f2f2; color: #555;">LUNCH BREAK</td>`;
          }
        }
      }
      rowHtml += `</tr>`;
      dynamicRows += rowHtml;
      isFirstRow = false;
    }

    // 3. Build Subject Rows
    let subjectRows = '';
    for (const cs of classSubjects) {
      const sub = cs.subject;
      // Gather teachers for this subject
      const teachers = sub.teacherSubjects.map(ts => ts.teacher.name).join(', ');
      
      subjectRows += `
        <tr>
          <td>${sub.code}</td>
          <td>${sub.name}</td>
          <td>${sub.creditHours}</td>
          <td>${teachers || 'N/A'}</td>
        </tr>
      `;
    }

    // 4. Inject into HTML Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }

          .header {
            text-align: center;
            font-weight: bold;
          }

          .header h1 {
            margin: 0;
            font-size: 22px;
          }

          .header h2 {
            margin: 5px 0 20px;
            font-size: 18px;
          }

          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
          }

          .meta-left, .meta-right {
            line-height: 1.6;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          table, th, td {
            border: 1px solid black;
          }

          th, td {
            padding: 6px;
            text-align: center;
            font-size: 12px;
          }

          .subjects-table th {
            background-color: #f2f2f2;
          }

          .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <!-- Logo Placeholder -->
          <h1>MBM UNIVERSITY, JODHPUR</h1>
          <h2>TIME TABLE 2025-26</h2>
        </div>

        <div class="meta">
          <div class="meta-left">
            <div><strong>Class and Semester:</strong> ${data.branch} Year ${data.year}</div>
            <div><strong>Department:</strong> ${data.branch}</div>
          </div>
          <div class="meta-right">
            <div><strong>W.E.F.:</strong> 01/08/2025</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>10:00-11:00</th>
              <th>11:00-12:00</th>
              <th>12:00-12:45</th>
              <th style="background-color: #f2f2f2; font-size: 10px; width: 30px;">12:45-2:00</th>
              <th>2:00-3:00</th>
              <th>3:00-4:00</th>
              <th>4:00-4:45</th>
            </tr>
          </thead>
          <tbody>
            ${dynamicRows}
          </tbody>
        </table>

        <!-- Subject Details -->
        <table class="subjects-table">
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Credit Hours</th>
              <th>Teacher Name</th>
            </tr>
          </thead>
          <tbody>
            ${subjectRows}
          </tbody>
        </table>

        <div class="footer">
          <div>HOD Signature</div>
          <div>Time Table Incharge</div>
        </div>
      </body>
      </html>
    `;

    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error("PDF Generation error:", error);
      throw new AppError("Failed to generate PDF", 500, "INTERNAL_ERROR");
    }
  }
};
