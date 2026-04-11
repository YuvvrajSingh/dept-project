import cron from 'node-cron';
import { NotificationLogType } from '@prisma/client';
import { prisma } from '../prisma/client';
import { emailService } from './email.service';
import { SLOT_TIMES } from '../utils/timetableConstants';

export const schedulerService = {
  start() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkUpcomingClasses();
      } catch (err) {
        console.error('[SchedulerError]', err);
      }
    });
    console.log('[SchedulerService] Started.');
  },

  async checkUpcomingClasses() {
    const now = new Date();
    // Add 10 minutes
    const upcomingTime = new Date(now.getTime() + 10 * 60000);
    
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    let currentDayIndex = upcomingTime.getDay();
    if (currentDayIndex === 0) return; // Sunday is 0, we don't have Sunday (or it's Day 7). Our system: 1=Mon..6=Sat
    
    // Format "HH:MM"
    const hours = String(upcomingTime.getHours()).padStart(2, '0');
    const minutes = String(upcomingTime.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    let matchedSlotKeys: string[] = [];
    for (const [key, val] of Object.entries(SLOT_TIMES)) {
      if (val.start === timeStr) {
        matchedSlotKeys.push(key);
      }
    }

    if (matchedSlotKeys.length === 0) return; // No class starting exactly in 10 mins

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const slotKey of matchedSlotKeys) {
      const slotInt = parseInt(slotKey, 10);

      // Resolve the slotId from slot order for DB query
      const slot = await prisma.slot.findUnique({ where: { order: slotInt } });
      if (!slot) continue;

      // Search TimetableEntries — only for the active academic year
      const entries = await prisma.timetableEntry.findMany({
        where: {
          day: currentDayIndex,
          slotId: slot.id,
          classSection: {
            academicYear: { isActive: true },
          },
        },
        include: {
          slot: true,
          classSection: { include: { branch: true } },
          subject: true,
          teacher: true,
          room: true,
          labGroups: {
            include: { subject: true, teacher: true, lab: true }
          }
        }
      });

      for (const entry of entries) {
        if (entry.entryType === 'LECTURE' && entry.teacher?.email) {
          await this.notifyTeacher(
            entry.id,
            entry.teacher.id,
            entry.teacher.email,
            entry.teacher.name,
            `${entry.classSection.branch.name} - Y${entry.classSection.year}`,
            entry.subject?.name || 'Unknown',
            entry.room?.name || 'Unknown',
            SLOT_TIMES[slotInt as keyof typeof SLOT_TIMES].start,
            startOfToday
          );
        } else if (entry.entryType === 'LAB') {
          for (const labGroup of entry.labGroups) {
            if (labGroup.teacher?.email) {
              await this.notifyTeacher(
                entry.id,
                labGroup.teacher.id,
                labGroup.teacher.email,
                labGroup.teacher.name,
                `${entry.classSection.branch.name} - Y${entry.classSection.year} (${labGroup.groupName})`,
                labGroup.subject?.name || 'Lab',
                labGroup.lab.name,
                SLOT_TIMES[slotInt as keyof typeof SLOT_TIMES].start,
                startOfToday
              );
            }
          }
        }
      }
    }
  },

  async notifyTeacher(
    entryId: number, 
    teacherId: number, 
    email: string, 
    teacherName: string,
    className: string,
    subjectName: string,
    roomName: string,
    timeStr: string,
    today: Date
  ) {
    // Check if already notified
    const existing = await prisma.notificationLog.findUnique({
      where: {
        timetableEntryId_teacherId_type_date: {
          timetableEntryId: entryId,
          teacherId: teacherId,
          type: NotificationLogType.TIMETABLE_CHANGE,
          date: today
        }
      }
    });

    if (existing) return; // already sent

    // Send email
    await emailService.sendClassReminder({
      teacherEmail: email,
      teacherName: teacherName,
      className: className,
      subjectName: subjectName,
      roomName: roomName,
      timeLabel: timeStr
    });

    // Log it
    await prisma.notificationLog.create({
      data: {
        timetableEntryId: entryId,
        teacherId: teacherId,
        type: NotificationLogType.TIMETABLE_CHANGE,
        date: today
      }
    });
  }
};
