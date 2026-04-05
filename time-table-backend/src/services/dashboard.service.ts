import { prisma } from "../prisma/client";

export const dashboardService = {
  async getMetrics() {
    // 1. Global Progress Tracker
    const classes = await prisma.classSection.findMany({
      include: {
        branch: true,
        subjects: { include: { subject: true } },
        timetable: { include: { labGroups: true } }
      }
    });

    const progress = classes.map((c) => {
      // Calculate required slots based on credit hours + lab needs
      let requiredSlots = 0;
      let scheduledSlots = 0;

      c.subjects.forEach((cs) => {
        if (cs.subject.type === "THEORY") {
          requiredSlots += cs.subject.creditHours;
        } else {
          // Lab needs 2 slots per 3 groups. So theoretically 3 pairs?
          // Let's just estimate 1 block per group = 3 groups * 2 slots = 6 slots
          requiredSlots += 6; 
        }
      });

      // Calculate filled slots
      c.timetable.forEach((entry) => {
        if (entry.entryType === "THEORY") {
          scheduledSlots += 1; // 1 slot
        } else if (entry.entryType === "LAB") {
          // Lab occupies multiple slots for groups
          // A 2-slot block with 2 groups = 4 student-slots
          scheduledSlots += entry.labGroups.length * (entry.slotEnd - entry.slotStart + 1);
        }
      });

      return {
        classSectionId: c.id,
        name: `${c.branch.name} - Year ${c.year}`,
        required: requiredSlots,
        scheduled: scheduledSlots,
        percentage: requiredSlots > 0 ? Math.min(100, Math.round((scheduledSlots / requiredSlots) * 100)) : 100
      };
    });

    // 2. Teacher Workload (Hours per week)
    const teachers = await prisma.teacher.findMany({
      include: {
        timetableEntries: true,
        labGroupEntries: { include: { timetableEntry: true } }
      }
    });

    const workload = teachers.map((t) => {
      let hours = 0;
      t.timetableEntries.forEach((entry) => {
        if (entry.entryType === "THEORY") hours += 1;
      });
      t.labGroupEntries.forEach((lab) => {
         hours += (lab.timetableEntry.slotEnd - lab.timetableEntry.slotStart + 1);
      });
      return {
        teacherId: t.id,
        name: t.name,
        abbreviation: t.abbreviation,
        hours
      };
    });

    // Sort by hours descending
    workload.sort((a, b) => b.hours - a.hours);

    // 3. Room Utilization Heatmap
    const allRooms = await prisma.room.findMany();
    const timetable = await prisma.timetableEntry.findMany({
      where: { entryType: "THEORY", roomId: { not: null } },
      include: { room: true }
    });
    
    // heatmap[day][slot] = { occupied: number, occupiedRoomIds: Set<number> }
    const heatmap: Record<number, Record<number, { occupied: number, occupiedRoomIds: Set<number> }>> = {};
    for (let d = 1; d <= 6; d++) {
      heatmap[d] = { 
        1: { occupied: 0, occupiedRoomIds: new Set() }, 
        2: { occupied: 0, occupiedRoomIds: new Set() }, 
        3: { occupied: 0, occupiedRoomIds: new Set() }, 
        4: { occupied: 0, occupiedRoomIds: new Set() }, 
        5: { occupied: 0, occupiedRoomIds: new Set() }, 
        6: { occupied: 0, occupiedRoomIds: new Set() } 
      };
    }

    timetable.forEach((entry) => {
      if (entry.roomId && heatmap[entry.day] && heatmap[entry.day][entry.slotStart]) {
        heatmap[entry.day][entry.slotStart].occupied += 1;
        heatmap[entry.day][entry.slotStart].occupiedRoomIds.add(entry.roomId);
      }
    });

    const heatmapFormatted = [];
    for (let d = 1; d <= 6; d++) {
      for (let s = 1; s <= 6; s++) {
        const stats = heatmap[d][s];
        const percentage = allRooms.length > 0 ? Math.round((stats.occupied / allRooms.length) * 100) : 0;
        
        // Calculate the explicitly free rooms for drill-down usage
        const freeRooms = allRooms.filter(r => !stats.occupiedRoomIds.has(r.id)).map(r => r.name);

        heatmapFormatted.push({ 
           day: d, 
           slot: s, 
           percentage, 
           occupied: stats.occupied, 
           total: allRooms.length,
           freeRooms 
        });
      }
    }

    // 4. Live Audit Log
    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15
    });

    const entryIds = logs.map(l => l.timetableEntryId);
    const logEntries = await prisma.timetableEntry.findMany({
      where: { id: { in: entryIds } },
      include: { subject: true, classSection: { include: { branch: true } } }
    });
    
    const entryMap = new Map();
    for (const e of logEntries) entryMap.set(e.id, e);

    const auditFeed = logs.map((l) => {
      const entry = entryMap.get(l.timetableEntryId);
      const subjectName = entry?.subject?.name || "Unknown";
      const className = entry?.classSection?.branch?.name || "Unknown Class";
      const type = l.type === "CANCELLATION" ? "CONFLICT DETECTED" : "SYSTEM NOTIFICATION";
      return {
        id: l.id,
        timestamp: l.createdAt.toISOString(),
        type,
        message: `[${type}] ${subjectName} class for ${className} on Day ${entry?.day || '?'} Slot ${entry?.slotStart || '?'} triggered an update.`,
        classSectionId: entry?.classSectionId || null
      };
    });

    return {
      progress,
      workload,
      heatmap: heatmapFormatted,
      auditFeed
    };
  }
};
