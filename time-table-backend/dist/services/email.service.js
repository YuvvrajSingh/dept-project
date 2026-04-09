"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
exports.emailService = {
    async sendClassReminder(props) {
        const title = props.isCancellation
            ? `Cancellation Alert - ${props.subjectName}`
            : `Class Reminder - ${props.subjectName}`;
        const content = props.isCancellation
            ? `Notice: Your ${props.timeLabel} class is cancelled.`
            : `Reminder that your class is scheduled:<br><br>
         <b>Class:</b> ${props.className}<br>
         <b>Subject:</b> ${props.subjectName}<br>
         <b>Room:</b> ${props.roomName}<br>
         <b>Time:</b> ${props.timeLabel}<br><br>
         Starts in 10 minutes.`;
        const htmlBody = `
      <div style="font-family: Arial, sans-serif;">
        <p>Hello ${props.teacherName},</p>
        <p>${content}</p>
      </div>
    `;
        try {
            const info = await transporter.sendMail({
                from: `"Timetable Notifications" <${process.env.SMTP_USER}>`,
                to: props.teacherEmail,
                subject: title,
                html: htmlBody,
            });
            console.log(`[EmailService] Sent ${props.isCancellation ? 'Cancellation' : 'Reminder'} to ${props.teacherEmail}:`, info.messageId);
        }
        catch (error) {
            console.error(`[EmailService] Failed to send email to ${props.teacherEmail}:`, error);
        }
    }
};
