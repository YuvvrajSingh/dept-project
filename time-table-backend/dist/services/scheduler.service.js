"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("../prisma/client");
const email_service_1 = require("./email.service");
const timetableConstants_1 = require("../utils/timetableConstants");
exports.schedulerService = {
    start() {
        // Run every minute
        node_cron_1.default.schedule('* * * * *', async () => {
            try {
                await this.checkUpcomingClasses();
            }
            catch (err) {
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
        if (currentDayIndex === 0)
            return; // Sunday is 0, we don't have Sunday (or it's Day 7). Our system: 1=Mon..6=Sat
        // Format "HH:MM"
        const hours = String(upcomingTime.getHours()).padStart(2, '0');
        const minutes = String(upcomingTime.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        let matchedSlotKeys = [];
        for (const [key, val] of Object.entries(timetableConstants_1.SLOT_TIMES)) {
            if (val.start === timeStr) {
                matchedSlotKeys.push(key);
            }
        }
        if (matchedSlotKeys.length === 0)
            return; // No class starting exactly in 10 mins
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (const slotKey of matchedSlotKeys) {
            const slotInt = parseInt(slotKey, 10);
            // Search TimetableEntries
            const entries = await client_1.prisma.timetableEntry.findMany({
                where: {
                    day: currentDayIndex,
                    slotStart: slotInt,
                },
                include: {
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
                if (entry.entryType === 'THEORY' && entry.teacher?.email) {
                    await this.notifyTeacher(entry.id, entry.teacher.id, entry.teacher.email, entry.teacher.name, `${entry.classSection.branch.name} - Y${entry.classSection.year}`, entry.subject?.name || 'Unknown', entry.room?.name || 'Unknown', timetableConstants_1.SLOT_TIMES[slotInt].start, startOfToday);
                }
                else if (entry.entryType === 'LAB') {
                    for (const labGroup of entry.labGroups) {
                        if (labGroup.teacher?.email) {
                            await this.notifyTeacher(entry.id, labGroup.teacher.id, labGroup.teacher.email, labGroup.teacher.name, `${entry.classSection.branch.name} - Y${entry.classSection.year} (${labGroup.groupName})`, labGroup.subject?.name || 'Lab', labGroup.lab.name, timetableConstants_1.SLOT_TIMES[slotInt].start, startOfToday);
                        }
                    }
                }
            }
        }
    },
    async notifyTeacher(entryId, teacherId, email, teacherName, className, subjectName, roomName, timeStr, today) {
        // Check if already notified
        const existing = await client_1.prisma.notificationLog.findUnique({
            where: {
                timetableEntryId_teacherId_type_date: {
                    timetableEntryId: entryId,
                    teacherId: teacherId,
                    type: 'REMINDER',
                    date: today
                }
            }
        });
        if (existing)
            return; // already sent
        // Send email
        await email_service_1.emailService.sendClassReminder({
            teacherEmail: email,
            teacherName: teacherName,
            className: className,
            subjectName: subjectName,
            roomName: roomName,
            timeLabel: timeStr
        });
        // Log it
        await client_1.prisma.notificationLog.create({
            data: {
                timetableEntryId: entryId,
                teacherId: teacherId,
                type: 'REMINDER',
                date: today
            }
        });
    }
};
