import * as XLSX from 'xlsx';
import type { EmployeeTimesheet, TimesheetDayRecord, TimesheetSummary } from '../types';

export const TIMESHEET_API_URL = 'https://api.hoseinikhodro.com/webhook/54f76090-189b-47d7-964e-f871c4d6513b/api/v1/timesheet';

export const RAW_SAMPLE_TIMESHEET_CSV = `حسيني خودرو شيراز,,,,,,,,,,,,,,,,,,,,,
گزارش تردد و کارکرد يک فرد,,,,,,,,,,,,,,,,,,,,,
از تاريخ:1405/06/01               تا تاريخ:1405/06/29   کارمند نمونه  کد:1,,,,,,,,,,,,,,,,,,,,,
روز هفته,تاريخ,ورود صبح,خروج صبح,ورود عصر,خروج عصر,موظفي,حضور,کارکرد,تاخير صبح,تعج-خروج ص,تعج-خروج ع,تاخير غير مجاز,اض تعطيلي,کارکرد نهائي,موظفی مرخصی,مرخصی,ماموریت,تعداد تردد,وضعیت,ج اضافه کار,ج  کسر کار
یکشنبه,1405/06/01,8:38,15:20,17:30,19:47,7:00,8:59,8:59,0:08,0,0,0:08,0,8:59,0,0,0,4,کاری,1:59,0:00
دوشنبه,1405/06/02,8:36,15:14,17:25,19:50,7:00,9:03,9:03,0:06,0,0,0:06,0,9:03,0,0,0,4,کاری,2:03,0:00
سه شنبه,1405/06/03,8:41,14:38,17:48,20:09,7:00,8:18,8:18,0:11,0,0,0:29,0,8:18,0,0,0,4,کاری,1:18,0:00
چهارشنبه,1405/06/04,8:46,14:35,18:03,20:02,5:30,7:48,7:48,0:16,0,0,0:16,0,7:48,0,0,0,4,کاری,2:18,0:00
پنج شنبه,1405/06/05,8:41,14:08,0:00,0:00,5:00,5:27,5:27,0:11,0,0,0:11,0,5:27,0,0,0,2,کاری,0:27,0:00
جمعه,1405/06/06,0:00,0:00,0:00,0:00,0,0,0,0,0,0,0,0,0:00,0,0,0,0,تعطیل,0,0
شنبه,1405/06/07,7:43,14:21,17:31,19:43,7:00,8:50,8:50,0,0,0,0:01,0,8:50,0,0,0,4,کاری,1:50,0:00
یکشنبه,1405/06/08,0:00,0:00,0:00,0:00,0,0,0,0,0,0,0,0,0:00,0,0,0,0,تعطیل,0,0
دوشنبه,1405/06/09,8:33,14:30,18:15,20:07,7:00,7:49,7:49,0:03,0,0,0:48,0,7:49,0,0,0,4,کاری,0:49,0:00
سه شنبه,1405/06/10,8:49,14:59,17:29,19:59,7:00,8:40,8:40,0:19,0,0,0:19,0,8:40,0,0,0,4,کاری,1:40,0:00
چهارشنبه,1405/06/11,8:50,14:49,0:00,0:00,5:30,5:59,5:59,0:20,0,0,0:20,0,5:59,0,0,0,2,کاری,0:29,0:00
پنج شنبه,1405/06/12,8:32,13:44,0:00,0:00,5:00,5:12,5:12,0:02,0,0,0:02,0,5:12,0,0,0,2,کاری,0:12,0:00
جمعه,1405/06/13,0:00,0:00,0:00,0:00,0,0,0,0,0,0,0,0,0:00,0,0,0,0,تعطیل,0,0
شنبه,1405/06/14,8:52,15:16,17:35,19:39,7:00,8:28,8:28,0:22,0,0,0:27,0,8:28,0,0,0,4,کاری,1:28,0:00
یکشنبه,1405/06/15,8:54,14:47,17:41,20:04,7:00,8:16,8:16,0:24,0,0,0:35,0,8:16,0,0,0,4,کاری,1:16,0:00
دوشنبه,1405/06/16,8:55,14:41,17:36,20:00,7:00,8:10,8:10,0:25,0,0,0:31,0,8:10,0,0,0,4,کاری,1:10,0:00
سه شنبه,1405/06/17,8:54,14:35,17:38,20:14,7:00,8:17,8:17,0:24,0,0,0:32,0,8:17,0,0,0,4,کاری,1:17,0:00
چهارشنبه,1405/06/18,8:51,15:00,0:00,0:00,5:30,6:09,6:09,0:21,0,0,0:21,0,6:09,0,0,0,2,کاری,0:39,0:00
پنج شنبه,1405/06/19,8:45,13:58,0:00,0:00,5:00,5:13,5:13,0:15,0,0,0:15,0,5:13,0,0,0,2,کاری,0:13,0:00
جمعه,1405/06/20,0:00,0:00,0:00,0:00,0,0,0,0,0,0,0,0,0:00,0,0,0,0,تعطیل,0,0
شنبه,1405/06/21,8:50,14:08,17:30,19:35,7:00,7:23,7:23,0:20,0,0,0:20,0,7:23,0,0,0,4,کاری,0:23,0:00
یکشنبه,1405/06/22,8:59,14:34,17:38,20:01,7:00,7:58,7:58,0:29,0,0,0:37,0,7:58,0,0,0,4,کاری,0:58,0:00
دوشنبه,1405/06/23,0:00,0:00,0:00,0:00,7:00,0,0,0,0,0,0,0,0:00,7:00,0,0,0,مرخصی استحقاقي,0,0
سه شنبه,1405/06/24,0:00,0:00,0:00,0:00,7:00,0,0,0,0,0,0,0,0:00,7:00,0,0,0,مرخصی استحقاقي,0,0
چهارشنبه,1405/06/25,8:52,14:37,0:00,0:00,5:30,5:45,5:45,0:22,0,0,0:22,0,5:45,0,0,0,2,کاری,0:15,0:00
پنج شنبه,1405/06/26,8:50,13:39,0:00,0:00,5:00,4:49,4:49,0:20,0,0,0:20,0,4:49,0,0,0,2,کاری,0:00,0:11
جمعه,1405/06/27,0:00,0:00,0:00,0:00,0,0,0,0,0,0,0,0,0:00,0,0,0,0,تعطیل,0,0
شنبه,1405/06/28,8:53,14:26,17:45,19:57,7:00,7:45,7:45,0:23,0,0,0:38,0,7:45,0,0,0,4,کاری,0:45,0:00
یکشنبه,1405/06/29,8:50,0:00,0:00,0:00,7:00,0,0,0:20,0,0,1:50,0,0:00,0,0,0,1,کاری,0:00,1:50
,,,,,,,,,,,,,,,,,,,,,
مجموع,,,,,,6:10,6:10:18,6:10:18,6:01,0:00,0:00,9:28,0:00,6:10:18,14:00,0:00,0:00,,,21:29,2:01`;

const cleanVal = (val?: string): string => {
    if (!val) return '0';
    const trimmed = val.trim();
    return trimmed === '' ? '0' : trimmed;
};

/**
 * Parses raw CSV output from Iranian fingerprint / biometric attendance machines
 */
export function parseTimesheetCSV(csvContent: string): EmployeeTimesheet {
    const lines = csvContent
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    let organization = 'حسینی خودرو شیراز';
    let title = 'گزارش تردد و کارکرد پرسنل';
    let startDate = '';
    let endDate = '';
    let employeeName = 'پرسنل';
    let employeeCode = '1';

    const records: TimesheetDayRecord[] = [];
    let summary: Partial<TimesheetSummary> = {};

    let headerPassed = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Line 1: Organization
        if (i === 0 && !line.includes('روز هفته')) {
            const org = line.split(',')[0]?.trim();
            if (org) organization = org;
            continue;
        }

        // Line 2: Title
        if (i === 1 && !line.includes('روز هفته')) {
            const t = line.split(',')[0]?.trim();
            if (t) title = t;
            continue;
        }

        // Line 3: Info (از تاریخ:... تا تاریخ:... نام... کد:...)
        if (line.includes('از تاريخ') || line.includes('از تاریخ') || line.includes('کد:')) {
            const text = line.replace(/,+/g, ' ').trim();
            
            const startMatch = text.match(/از\s*تار[یي]خ\s*:\s*([^\s]+)/);
            if (startMatch) startDate = startMatch[1];

            const endMatch = text.match(/تا\s*تار[یي]خ\s*:\s*([^\s]+)/);
            if (endMatch) endDate = endMatch[1];

            const codeMatch = text.match(/کد\s*:\s*([^\s]+)/);
            if (codeMatch) employeeCode = codeMatch[1];

            // Extract name between end date and code
            const nameMatch = text.match(/تا\s*تار[یي]خ\s*:\s*[^\s]+\s+(.*?)\s+کد\s*:/);
            if (nameMatch && nameMatch[1]) {
                employeeName = nameMatch[1].trim();
            } else if (!employeeName || employeeName === 'پرسنل') {
                // Fallback attempt
                const parts = text.split(/\s+/);
                const kdIndex = parts.findIndex(p => p.includes('کد:'));
                if (kdIndex > 2) {
                    employeeName = parts.slice(2, kdIndex).join(' ');
                }
            }
            continue;
        }

        // Header line
        if (line.includes('روز هفته') && line.includes('تاريخ')) {
            headerPassed = true;
            continue;
        }

        if (!headerPassed) continue;

        const cols = line.split(',').map(c => c.trim());

        // Check if this is the Summary line
        if (cols[0] === 'مجموع') {
            summary = {
                totalDuty: cols[6] || '0',
                totalPresence: cols[7] || '0',
                totalWorkTime: cols[8] || '0',
                totalMorningDelay: cols[9] || '0',
                totalMorningEarlyExit: cols[10] || '0',
                totalAfternoonEarlyExit: cols[11] || '0',
                totalUnauthorizedDelay: cols[12] || '0',
                totalHolidayOvertime: cols[13] || '0',
                totalFinalWorkTime: cols[14] || '0',
                totalLeaveDuty: cols[15] || '0',
                totalLeaveTime: cols[16] || '0',
                totalMissionTime: cols[17] || '0',
                totalOvertime: cols[20] || '0',
                totalDeficit: cols[21] || '0',
            };
            continue;
        }

        // Ignore empty comma rows like ",,,,,,,,,,,,,"
        if (cols.every(c => c === '')) continue;

        // Daily record row
        const dayOfWeek = cols[0] || '';
        const date = cols[1] || '';

        // Make sure it looks like a valid record
        if (!date || date.length < 5) continue;

        const record: TimesheetDayRecord = {
            id: `rec_${date.replace(/[^0-9]/g, '')}_${Math.random().toString(36).substring(2, 7)}`,
            dayOfWeek,
            date,
            morningEntry: cleanVal(cols[2]),
            morningExit: cleanVal(cols[3]),
            afternoonEntry: cleanVal(cols[4]),
            afternoonExit: cleanVal(cols[5]),
            dutyHours: cleanVal(cols[6]),
            presence: cleanVal(cols[7]),
            workTime: cleanVal(cols[8]),
            morningDelay: cleanVal(cols[9]),
            morningEarlyExit: cleanVal(cols[10]),
            afternoonEarlyExit: cleanVal(cols[11]),
            unauthorizedDelay: cleanVal(cols[12]),
            holidayOvertime: cleanVal(cols[13]),
            finalWorkTime: cleanVal(cols[14]),
            leaveDuty: cleanVal(cols[15]),
            leaveTime: cleanVal(cols[16]),
            missionTime: cleanVal(cols[17]),
            punchesCount: parseInt(cols[18] || '0', 10) || 0,
            status: cols[19] || 'کاری',
            overtime: cleanVal(cols[20]),
            deficit: cleanVal(cols[21]),
        };

        records.push(record);
    }

    // Compute derived summary metrics
    const workDaysCount = records.filter(r => r.status.includes('کاری')).length;
    const holidayDaysCount = records.filter(r => r.status.includes('تعطیل')).length;
    const leaveDaysCount = records.filter(r => r.status.includes('مرخصی')).length;
    const totalPunches = records.reduce((sum, r) => sum + (r.punchesCount || 0), 0);

    const fullSummary: TimesheetSummary = {
        totalDuty: summary.totalDuty || '0',
        totalPresence: summary.totalPresence || '0',
        totalWorkTime: summary.totalWorkTime || '0',
        totalMorningDelay: summary.totalMorningDelay || '0',
        totalMorningEarlyExit: summary.totalMorningEarlyExit || '0',
        totalAfternoonEarlyExit: summary.totalAfternoonEarlyExit || '0',
        totalUnauthorizedDelay: summary.totalUnauthorizedDelay || '0',
        totalHolidayOvertime: summary.totalHolidayOvertime || '0',
        totalFinalWorkTime: summary.totalFinalWorkTime || '0',
        totalLeaveDuty: summary.totalLeaveDuty || '0',
        totalLeaveTime: summary.totalLeaveTime || '0',
        totalMissionTime: summary.totalMissionTime || '0',
        totalOvertime: summary.totalOvertime || '0',
        totalDeficit: summary.totalDeficit || '0',
        workDaysCount,
        holidayDaysCount,
        leaveDaysCount,
        totalPunches
    };

    return {
        id: `ts_${employeeCode}_${startDate.replace(/[^0-9]/g, '')}`,
        organization,
        title,
        startDate: startDate || (records[0]?.date ?? ''),
        endDate: endDate || (records[records.length - 1]?.date ?? ''),
        employeeName: employeeName || 'کارمند',
        employeeCode: employeeCode || '1',
        records,
        summary: fullSummary,
        lastUpdated: new Date().toISOString(),
        source: 'csv_import'
    };
}

/**
 * Splits a text containing multiple employee timesheet sections into individual EmployeeTimesheet objects
 */
export function parseMultiEmployeeCSV(csvContent: string): EmployeeTimesheet[] {
    const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isEmployeeHeader = (line.includes('گزارش تردد و کارکرد') || line.includes('از تاريخ') || line.includes('از تاریخ')) && (line.includes('کد:') || line.includes('کد :'));
        
        // If we hit a new employee header line and currentBlock already has records
        if (isEmployeeHeader && currentBlock.some(l => l.includes('روز هفته') || l.includes('140') || l.includes('139'))) {
            blocks.push(currentBlock);
            currentBlock = [line];
        } else {
            currentBlock.push(line);
        }
    }
    if (currentBlock.length > 0) {
        blocks.push(currentBlock);
    }

    if (blocks.length <= 1) {
        const single = parseTimesheetCSV(csvContent);
        return single.records.length > 0 ? [single] : [];
    }

    const results: EmployeeTimesheet[] = [];
    for (const block of blocks) {
        const text = block.join('\n');
        try {
            const sheet = parseTimesheetCSV(text);
            if (sheet.records.length > 0) {
                results.push(sheet);
            }
        } catch (e) {
            console.warn('Failed to parse employee block in multi-CSV', e);
        }
    }
    return results.length > 0 ? results : [parseTimesheetCSV(csvContent)];
}

/**
 * Parses binary Excel buffer (.xls or .xlsx) exported from attendance / biometric machines
 */
export function parseTimesheetExcelBuffer(buffer: ArrayBuffer | Uint8Array, fileName?: string): EmployeeTimesheet[] {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: false });
    const sheets: EmployeeTimesheet[] = [];

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Convert worksheet to CSV text
        const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
        if (!csv || csv.trim().length === 0) continue;

        const parsedSheets = parseMultiEmployeeCSV(csv);
        parsedSheets.forEach(ps => {
            // If employee name is still default or fallback, try to deduce from sheetName or fileName
            if ((!ps.employeeName || ps.employeeName === 'پرسنل') && sheetName && !sheetName.toLowerCase().startsWith('sheet')) {
                ps.employeeName = sheetName;
            } else if ((!ps.employeeName || ps.employeeName === 'پرسنل') && fileName) {
                const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[0-9_\-\.]/g, ' ').trim();
                if (cleanName) ps.employeeName = cleanName;
            }
            sheets.push(ps);
        });
    }

    return sheets;
}

export interface BulkUploadResult {
    sheets: EmployeeTimesheet[];
    errors: { fileName: string; error: string }[];
    totalFiles: number;
    successFiles: number;
}

/**
 * Parses a batch of files (.xls, .xlsx, .csv, .txt) selected by the user simultaneously
 */
export async function parseBulkUploadedFiles(files: File[]): Promise<BulkUploadResult> {
    const allSheets: EmployeeTimesheet[] = [];
    const errors: { fileName: string; error: string }[] = [];
    let successFiles = 0;

    for (const file of files) {
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            if (ext === 'xls' || ext === 'xlsx') {
                const buffer = await file.arrayBuffer();
                const extracted = parseTimesheetExcelBuffer(buffer, file.name);
                if (extracted.length > 0) {
                    allSheets.push(...extracted);
                    successFiles++;
                } else {
                    errors.push({ 
                        fileName: file.name, 
                        error: 'هیچ ردیف تردد یا الگوی استاندارد دستگاه حضور و غیاب در این فایل اکسل یافت نشد.' 
                    });
                }
            } else if (ext === 'csv' || ext === 'txt') {
                const text = await file.text();
                const extracted = parseMultiEmployeeCSV(text);
                if (extracted.length > 0) {
                    allSheets.push(...extracted);
                    successFiles++;
                } else {
                    errors.push({ 
                        fileName: file.name, 
                        error: 'سطرهای تردد معتبر در فایل متنی یافت نشد.' 
                    });
                }
            } else {
                errors.push({ 
                    fileName: file.name, 
                    error: `فرمت ${ext} پشتیبانی نمی‌شود. فقط فایل‌های .xls، .xlsx یا .csv مجاز هستند.` 
                });
            }
        } catch (err: any) {
            errors.push({ 
                fileName: file.name, 
                error: err?.message || 'خطا در بارگذاری و پردازش فایل اکسل' 
            });
        }
    }

    return {
        sheets: allSheets,
        errors,
        totalFiles: files.length,
        successFiles
    };
}

/**
 * Parses time string (e.g. "21:29", "2:01", "182:23", "6:10:18") into total minutes
 */
export function parseTimeToMinutes(timeStr?: string): number {
    if (!timeStr || timeStr === '0' || timeStr === '0:00' || timeStr === '00:00') return 0;
    const clean = timeStr.replace(/^[+-]/, '').trim();
    const parts = clean.split(':').map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
        // Biometric machine day:hour:min or hour:min:sec
        if (parts[0] > 24) {
            return parts[0] * 60 + parts[1];
        }
        // e.g. 6:10:18 => 6 days * 24h + 10h = 154h + 18m
        return (parts[0] * 24 + parts[1]) * 60 + parts[2];
    }
    return 0;
}

/**
 * Formats minutes to Persian/Standard hours and minutes (e.g. 154:18)
 */
export function formatMinutesToTime(totalMinutes: number): string {
    const isNegative = totalMinutes < 0;
    const absMin = Math.abs(Math.round(totalMinutes));
    const hours = Math.floor(absMin / 60);
    const minutes = absMin % 60;
    const formatted = `${hours}:${minutes.toString().padStart(2, '0')}`;
    return isNegative ? `-${formatted}` : formatted;
}

/**
 * Calculates duration between entry and exit punch in minutes
 */
export function calculateDurationMinutes(entry?: string, exit?: string): number {
    if (!entry || !exit || entry === '0' || exit === '0' || entry === '0:00' || exit === '0:00' || entry === '-' || exit === '-') {
        return 0;
    }
    const entryMin = parseTimeToMinutes(entry);
    const exitMin = parseTimeToMinutes(exit);
    if (exitMin > entryMin) {
        return exitMin - entryMin;
    }
    return 0;
}

/**
 * Recalculates all dependent times (presence, work time, morning delay, overtime, deficit)
 * based on single day entry and exit punches.
 */
export function recalculateDayRecord(
    record: TimesheetDayRecord,
    options?: {
        defaultShiftMorningStart?: string;
        defaultDutyHours?: string;
    }
): TimesheetDayRecord {
    const shiftStart = options?.defaultShiftMorningStart || '08:30';
    const dutyHoursStr = record.dutyHours && record.dutyHours !== '0' && record.dutyHours !== '-' 
        ? record.dutyHours 
        : (options?.defaultDutyHours || '07:00');

    const morningDur = calculateDurationMinutes(record.morningEntry, record.morningExit);
    const afternoonDur = calculateDurationMinutes(record.afternoonEntry, record.afternoonExit);
    const totalPresenceMin = morningDur + afternoonDur;

    // Calculate punch count
    let punches = 0;
    if (record.morningEntry && record.morningEntry !== '0' && record.morningEntry !== '0:00' && record.morningEntry !== '-') punches++;
    if (record.morningExit && record.morningExit !== '0' && record.morningExit !== '0:00' && record.morningExit !== '-') punches++;
    if (record.afternoonEntry && record.afternoonEntry !== '0' && record.afternoonEntry !== '0:00' && record.afternoonEntry !== '-') punches++;
    if (record.afternoonExit && record.afternoonExit !== '0' && record.afternoonExit !== '0:00' && record.afternoonExit !== '-') punches++;

    // Calculate morning delay
    let morningDelayMin = 0;
    if (record.morningEntry && record.morningEntry !== '0' && record.morningEntry !== '0:00' && record.morningEntry !== '-' && !record.status?.includes('تعطیل')) {
        const entryMin = parseTimeToMinutes(record.morningEntry);
        const shiftMin = parseTimeToMinutes(shiftStart);
        if (entryMin > shiftMin) {
            morningDelayMin = entryMin - shiftMin;
        }
    }

    // Holiday handling
    if (record.status?.includes('تعطیل')) {
        return {
            ...record,
            presence: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            workTime: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            finalWorkTime: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            dutyHours: '0',
            morningDelay: '0',
            unauthorizedDelay: '0',
            overtime: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            deficit: '0',
            punchesCount: punches
        };
    }

    // Leave handling
    if (record.status?.includes('مرخصی')) {
        const dutyMin = parseTimeToMinutes(dutyHoursStr) || 420;
        return {
            ...record,
            dutyHours: dutyHoursStr,
            presence: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            workTime: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            finalWorkTime: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
            leaveDuty: formatMinutesToTime(dutyMin),
            leaveTime: formatMinutesToTime(dutyMin),
            overtime: '0',
            deficit: '0',
            morningDelay: '0',
            unauthorizedDelay: '0',
            punchesCount: punches
        };
    }

    // Standard working day
    const dutyMin = parseTimeToMinutes(dutyHoursStr);
    const workTimeMin = totalPresenceMin;
    let overtimeMin = 0;
    let deficitMin = 0;

    if (workTimeMin >= dutyMin) {
        overtimeMin = workTimeMin - dutyMin;
        deficitMin = 0;
    } else {
        overtimeMin = 0;
        deficitMin = dutyMin - workTimeMin;
    }

    return {
        ...record,
        dutyHours: dutyHoursStr,
        presence: totalPresenceMin > 0 ? formatMinutesToTime(totalPresenceMin) : '0',
        workTime: workTimeMin > 0 ? formatMinutesToTime(workTimeMin) : '0',
        finalWorkTime: workTimeMin > 0 ? formatMinutesToTime(workTimeMin) : '0',
        morningDelay: morningDelayMin > 0 ? formatMinutesToTime(morningDelayMin) : '0',
        unauthorizedDelay: morningDelayMin > 0 ? formatMinutesToTime(morningDelayMin) : '0',
        overtime: overtimeMin > 0 ? formatMinutesToTime(overtimeMin) : '0:00',
        deficit: deficitMin > 0 ? formatMinutesToTime(deficitMin) : '0:00',
        punchesCount: punches
    };
}

/**
 * Recalculates whole monthly timesheet summary totals from updated day records
 */
export function recalculateTimesheetSummary(records: TimesheetDayRecord[]): TimesheetSummary {
    let totalDutyMin = 0;
    let totalPresenceMin = 0;
    let totalWorkMin = 0;
    let totalMorningDelayMin = 0;
    let totalMorningEarlyExitMin = 0;
    let totalAfternoonEarlyExitMin = 0;
    let totalUnauthorizedDelayMin = 0;
    let totalHolidayOvertimeMin = 0;
    let totalFinalWorkMin = 0;
    let totalLeaveDutyMin = 0;
    let totalLeaveTimeMin = 0;
    let totalMissionTimeMin = 0;
    let totalOvertimeMin = 0;
    let totalDeficitMin = 0;

    let workDaysCount = 0;
    let holidayDaysCount = 0;
    let leaveDaysCount = 0;
    let totalPunches = 0;

    records.forEach(r => {
        totalDutyMin += parseTimeToMinutes(r.dutyHours);
        totalPresenceMin += parseTimeToMinutes(r.presence);
        totalWorkMin += parseTimeToMinutes(r.workTime);
        totalMorningDelayMin += parseTimeToMinutes(r.morningDelay);
        totalMorningEarlyExitMin += parseTimeToMinutes(r.morningEarlyExit);
        totalAfternoonEarlyExitMin += parseTimeToMinutes(r.afternoonEarlyExit);
        totalUnauthorizedDelayMin += parseTimeToMinutes(r.unauthorizedDelay);
        totalHolidayOvertimeMin += parseTimeToMinutes(r.holidayOvertime);
        totalFinalWorkMin += parseTimeToMinutes(r.finalWorkTime);
        totalLeaveDutyMin += parseTimeToMinutes(r.leaveDuty);
        totalLeaveTimeMin += parseTimeToMinutes(r.leaveTime);
        totalMissionTimeMin += parseTimeToMinutes(r.missionTime);
        totalOvertimeMin += parseTimeToMinutes(r.overtime);
        totalDeficitMin += parseTimeToMinutes(r.deficit);

        totalPunches += (r.punchesCount || 0);

        if (r.status?.includes('تعطیل')) {
            holidayDaysCount++;
        } else if (r.status?.includes('مرخصی')) {
            leaveDaysCount++;
        } else {
            workDaysCount++;
        }
    });

    return {
        totalDuty: formatMinutesToTime(totalDutyMin),
        totalPresence: formatMinutesToTime(totalPresenceMin),
        totalWorkTime: formatMinutesToTime(totalWorkMin),
        totalMorningDelay: formatMinutesToTime(totalMorningDelayMin),
        totalMorningEarlyExit: formatMinutesToTime(totalMorningEarlyExitMin),
        totalAfternoonEarlyExit: formatMinutesToTime(totalAfternoonEarlyExitMin),
        totalUnauthorizedDelay: formatMinutesToTime(totalUnauthorizedDelayMin),
        totalHolidayOvertime: formatMinutesToTime(totalHolidayOvertimeMin),
        totalFinalWorkTime: formatMinutesToTime(totalFinalWorkMin),
        totalLeaveDuty: formatMinutesToTime(totalLeaveDutyMin),
        totalLeaveTime: formatMinutesToTime(totalLeaveTimeMin),
        totalMissionTime: formatMinutesToTime(totalMissionTimeMin),
        totalOvertime: formatMinutesToTime(totalOvertimeMin),
        totalDeficit: formatMinutesToTime(totalDeficitMin),
        workDaysCount,
        holidayDaysCount,
        leaveDaysCount,
        totalPunches
    };
}

/**
 * Generates default seed timesheets for the dealership staff team
 */
export function getSeedDealershipTimesheets(): EmployeeTimesheet[] {
    const hilda = parseTimesheetCSV(RAW_SAMPLE_TIMESHEET_CSV);
    hilda.id = 'timesheet_hilda_1';

    // Employee 2: Alireza Hoseini - Sales & Delivery Director
    const alireza: EmployeeTimesheet = {
        id: 'timesheet_alireza_2',
        organization: 'حسینی خودرو شیراز',
        title: 'گزارش تردد و کارکرد پرسنل',
        startDate: '1405/06/01',
        endDate: '1405/06/29',
        employeeName: 'علیرضا حسینی',
        employeeCode: '2',
        source: 'sample',
        lastUpdated: new Date().toISOString(),
        records: hilda.records.map((r, i) => {
            if (r.status === 'تعطیل' || r.status.includes('مرخصی')) return { ...r, id: `alireza_rec_${i}` };
            return {
                ...r,
                id: `alireza_rec_${i}`,
                morningEntry: '08:25',
                morningExit: '14:40',
                afternoonEntry: '17:15',
                afternoonExit: '20:30',
                overtime: '01:45',
                deficit: '0:00',
                morningDelay: '0:00',
                unauthorizedDelay: '0:00',
                workTime: '08:30',
                finalWorkTime: '08:30'
            };
        }),
        summary: {
            totalDuty: '168:00',
            totalPresence: '198:30',
            totalWorkTime: '195:45',
            totalMorningDelay: '0:45',
            totalMorningEarlyExit: '0:00',
            totalAfternoonEarlyExit: '0:00',
            totalUnauthorizedDelay: '0:30',
            totalHolidayOvertime: '0:00',
            totalFinalWorkTime: '195:45',
            totalLeaveDuty: '0:00',
            totalLeaveTime: '0:00',
            totalMissionTime: '0:00',
            totalOvertime: '34:15',
            totalDeficit: '0:45',
            workDaysCount: 24,
            holidayDaysCount: 5,
            leaveDaysCount: 0,
            totalPunches: 96
        }
    };

    // Employee 3: Maryam Mohammadi - Financial & Accounting
    const maryam: EmployeeTimesheet = {
        id: 'timesheet_maryam_3',
        organization: 'حسینی خودرو شیراز',
        title: 'گزارش تردد و کارکرد پرسنل',
        startDate: '1405/06/01',
        endDate: '1405/06/29',
        employeeName: 'مریم محمدی',
        employeeCode: '3',
        source: 'sample',
        lastUpdated: new Date().toISOString(),
        records: hilda.records.map((r, i) => {
            if (r.status === 'تعطیل') return { ...r, id: `maryam_rec_${i}` };
            return {
                ...r,
                id: `maryam_rec_${i}`,
                morningEntry: '08:35',
                morningExit: '14:30',
                afternoonEntry: '17:30',
                afternoonExit: '19:40',
                overtime: '00:35',
                deficit: '0:00',
                morningDelay: '0:05',
                workTime: '07:35',
                finalWorkTime: '07:35'
            };
        }),
        summary: {
            totalDuty: '168:00',
            totalPresence: '176:40',
            totalWorkTime: '174:20',
            totalMorningDelay: '1:10',
            totalMorningEarlyExit: '0:00',
            totalAfternoonEarlyExit: '0:00',
            totalUnauthorizedDelay: '1:15',
            totalHolidayOvertime: '0:00',
            totalFinalWorkTime: '174:20',
            totalLeaveDuty: '7:00',
            totalLeaveTime: '7:00',
            totalMissionTime: '0:00',
            totalOvertime: '12:30',
            totalDeficit: '1:15',
            workDaysCount: 22,
            holidayDaysCount: 5,
            leaveDaysCount: 2,
            totalPunches: 86
        }
    };

    // Employee 4: Reza Abbasi - Technical Inspector & Workshop Chief
    const reza: EmployeeTimesheet = {
        id: 'timesheet_reza_4',
        organization: 'حسینی خودرو شیراز',
        title: 'گزارش تردد و کارکرد پرسنل',
        startDate: '1405/06/01',
        endDate: '1405/06/29',
        employeeName: 'رضا عباسی',
        employeeCode: '4',
        source: 'sample',
        lastUpdated: new Date().toISOString(),
        records: hilda.records.map((r, i) => {
            if (r.status === 'تعطیل') return { ...r, id: `reza_rec_${i}` };
            return {
                ...r,
                id: `reza_rec_${i}`,
                morningEntry: '08:28',
                morningExit: '15:10',
                afternoonEntry: '17:20',
                afternoonExit: '20:10',
                overtime: '01:20',
                deficit: '0:00',
                workTime: '08:15',
                finalWorkTime: '08:15'
            };
        }),
        summary: {
            totalDuty: '168:00',
            totalPresence: '190:20',
            totalWorkTime: '188:10',
            totalMorningDelay: '0:35',
            totalMorningEarlyExit: '0:00',
            totalAfternoonEarlyExit: '0:00',
            totalUnauthorizedDelay: '1:40',
            totalHolidayOvertime: '0:00',
            totalFinalWorkTime: '188:10',
            totalLeaveDuty: '0:00',
            totalLeaveTime: '0:00',
            totalMissionTime: '0:00',
            totalOvertime: '23:50',
            totalDeficit: '1:40',
            workDaysCount: 24,
            holidayDaysCount: 5,
            leaveDaysCount: 0,
            totalPunches: 94
        }
    };

    // Employee 5: Sara Taghavi - Customer Care & Follow-up
    const sara: EmployeeTimesheet = {
        id: 'timesheet_sara_5',
        organization: 'حسینی خودرو شیراز',
        title: 'گزارش تردد و کارکرد پرسنل',
        startDate: '1405/06/01',
        endDate: '1405/06/29',
        employeeName: 'سارا تقوی',
        employeeCode: '5',
        source: 'sample',
        lastUpdated: new Date().toISOString(),
        records: hilda.records.map((r, i) => {
            if (r.status === 'تعطیل' || r.status.includes('مرخصی')) return { ...r, id: `sara_rec_${i}` };
            return {
                ...r,
                id: `sara_rec_${i}`,
                morningEntry: '08:45',
                morningExit: '14:20',
                afternoonEntry: '17:35',
                afternoonExit: '19:30',
                overtime: '00:15',
                deficit: '0:15',
                morningDelay: '0:15',
                workTime: '07:05',
                finalWorkTime: '07:05'
            };
        }),
        summary: {
            totalDuty: '168:00',
            totalPresence: '171:20',
            totalWorkTime: '169:30',
            totalMorningDelay: '2:15',
            totalMorningEarlyExit: '0:00',
            totalAfternoonEarlyExit: '0:00',
            totalUnauthorizedDelay: '3:45',
            totalHolidayOvertime: '0:00',
            totalFinalWorkTime: '169:30',
            totalLeaveDuty: '7:00',
            totalLeaveTime: '7:00',
            totalMissionTime: '0:00',
            totalOvertime: '06:15',
            totalDeficit: '03:45',
            workDaysCount: 22,
            holidayDaysCount: 5,
            leaveDaysCount: 2,
            totalPunches: 82
        }
    };

    return [hilda, alireza, maryam, reza, sara];
}

const LOCAL_STORAGE_KEY = 'autolead_timesheets_v1';

export function getStoredTimesheets(): EmployeeTimesheet[] {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to read timesheets from localStorage', e);
    }

    // No offline fake dummy data by default as explicitly requested
    return [];
}

export function saveStoredTimesheets(sheets: EmployeeTimesheet[]): void {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheets));
    } catch (e) {
        console.error('Failed to save timesheets to localStorage', e);
    }
}

/**
 * Direct webhook backend CRUD service supporting PUT, GET, POST, DELETE, PATCH
 * for all attendance operations and uploaded files.
 */
export const timesheetApiService = {
    // GET: Retrieve timesheets from webhook server
    getAll: async (): Promise<EmployeeTimesheet[]> => {
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const headers: Record<string, string> = {
                'Accept': 'application/json, text/plain, */*'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(TIMESHEET_API_URL, {
                method: 'GET',
                headers
            });

            if (!res.ok) {
                console.warn(`GET ${TIMESHEET_API_URL} returned status ${res.status}`);
                return getStoredTimesheets();
            }

            const data = await res.json();
            
            // Check if returned data contains employee timesheets
            if (Array.isArray(data)) {
                if (data[0] && data[0].body && Array.isArray(data[0].body.sheets)) {
                    saveStoredTimesheets(data[0].body.sheets);
                    return data[0].body.sheets;
                }
                if (data[0] && (data[0].records || data[0].employeeCode)) {
                    saveStoredTimesheets(data as EmployeeTimesheet[]);
                    return data as EmployeeTimesheet[];
                }
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.sheets)) {
                    saveStoredTimesheets(data.sheets);
                    return data.sheets;
                }
                if (Array.isArray(data.data)) {
                    saveStoredTimesheets(data.data);
                    return data.data;
                }
                if (data.records) {
                    const single = [data as EmployeeTimesheet];
                    saveStoredTimesheets(single);
                    return single;
                }
            }

            return getStoredTimesheets();
        } catch (err) {
            console.error('Error fetching timesheets from webhook:', err);
            return getStoredTimesheets();
        }
    },

    // POST: Upload files or batch timesheets on webhook server
    uploadOrSaveSheets: async (sheets: EmployeeTimesheet[], fileNames?: string[]): Promise<EmployeeTimesheet[]> => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Save locally first to guarantee UI consistency
        saveStoredTimesheets(sheets);

        try {
            const payload = {
                action: 'UPLOAD_TIMESHEETS',
                timestamp: new Date().toISOString(),
                fileNames: fileNames || [],
                sheetsCount: sheets.length,
                sheets
            };

            await fetch(TIMESHEET_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn('Webhook upload post warning:', err);
        }

        return getStoredTimesheets();
    },

    // PUT: Update an entire sheet on webhook server
    updateSheet: async (sheet: EmployeeTimesheet): Promise<EmployeeTimesheet[]> => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Update stored cache
        const all = getStoredTimesheets();
        const updated = all.map(s => s.id === sheet.id ? sheet : s);
        saveStoredTimesheets(updated);

        try {
            const payload = {
                action: 'UPDATE_TIMESHEET',
                id: sheet.id,
                employeeCode: sheet.employeeCode,
                employeeName: sheet.employeeName,
                startDate: sheet.startDate,
                endDate: sheet.endDate,
                records: sheet.records,
                summary: sheet.summary,
                lastUpdated: new Date().toISOString()
            };

            await fetch(TIMESHEET_API_URL, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn('Webhook update sheet warning:', err);
        }

        return updated;
    },

    // PATCH: Partial update on single punch/day record
    patchRecord: async (sheetId: string, recordId: string, updates: Partial<TimesheetDayRecord>): Promise<any> => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = {
            action: 'PATCH_DAY_RECORD',
            sheetId,
            recordId,
            updates,
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(TIMESHEET_API_URL, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn('Webhook patch record warning:', err);
        }

        return { status: 'ok' };
    },

    // PATCH: Bulk update multiple day records
    bulkPatchRecords: async (sheetId: string, recordIds: string[], updates: Partial<TimesheetDayRecord>): Promise<any> => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = {
            action: 'BULK_PATCH_RECORDS',
            sheetId,
            recordIds,
            updates,
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(TIMESHEET_API_URL, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn('Webhook bulk patch warning:', err);
        }

        return { status: 'ok' };
    },

    // DELETE: Delete timesheet from webhook server
    deleteSheet: async (sheetId: string): Promise<EmployeeTimesheet[]> => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const all = getStoredTimesheets();
        const updated = all.filter(s => s.id !== sheetId);
        saveStoredTimesheets(updated);

        try {
            await fetch(TIMESHEET_API_URL, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ action: 'DELETE_TIMESHEET', id: sheetId })
            });
        } catch (err) {
            console.warn('Webhook delete warning:', err);
        }

        return updated;
    }
};

export function createManualTimesheet(
    employeeName: string,
    employeeCode: string,
    startDate: string,
    endDate: string,
    initialRecord?: Partial<TimesheetDayRecord>
): EmployeeTimesheet {
    const id = `ts_${employeeCode || 'emp'}_${Date.now()}`;
    const initialRecords: TimesheetDayRecord[] = [];
    
    if (initialRecord && initialRecord.date) {
        const fullRec = recalculateDayRecord({
            id: `rec_${Date.now()}_0`,
            dayOfWeek: initialRecord.dayOfWeek || 'شنبه',
            date: initialRecord.date,
            morningEntry: initialRecord.morningEntry || '08:30',
            morningExit: initialRecord.morningExit || '14:30',
            afternoonEntry: initialRecord.afternoonEntry || '17:00',
            afternoonExit: initialRecord.afternoonExit || '20:00',
            dutyHours: initialRecord.dutyHours || '07:00',
            presence: '0:00',
            workTime: '0:00',
            morningDelay: '0:00',
            morningEarlyExit: '0:00',
            afternoonEarlyExit: '0:00',
            unauthorizedDelay: '0:00',
            holidayOvertime: '0:00',
            finalWorkTime: '0:00',
            leaveDuty: '0:00',
            leaveTime: initialRecord.leaveTime || '0:00',
            missionTime: initialRecord.missionTime || '0:00',
            punchesCount: 4,
            status: initialRecord.status || 'کاری',
            overtime: '0:00',
            deficit: '0:00',
            ...initialRecord
        });
        initialRecords.push(fullRec);
    }

    const summary = recalculateTimesheetSummary(initialRecords);

    return {
        id,
        organization: 'حسینی خودرو شیراز',
        title: 'گزارش تردد و کارکرد پرسنل',
        startDate: startDate || initialRecord?.date || '1405/01/01',
        endDate: endDate || initialRecord?.date || '1405/12/29',
        employeeName: employeeName.trim() || 'کارمند جدید',
        employeeCode: employeeCode.trim() || '1',
        records: initialRecords,
        summary,
        lastUpdated: new Date().toISOString(),
        source: 'manual'
    };
}

export function addOrUpdateManualDayRecord(
    sheet: EmployeeTimesheet,
    dayRecord: Partial<TimesheetDayRecord> & { date: string }
): EmployeeTimesheet {
    const existingIndex = sheet.records.findIndex(r => r.date === dayRecord.date || (dayRecord.id && r.id === dayRecord.id));
    
    let baseRecord: TimesheetDayRecord;
    if (existingIndex >= 0) {
        baseRecord = { ...sheet.records[existingIndex], ...dayRecord };
    } else {
        baseRecord = {
            id: dayRecord.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            dayOfWeek: dayRecord.dayOfWeek || 'شنبه',
            date: dayRecord.date,
            morningEntry: dayRecord.morningEntry || '08:30',
            morningExit: dayRecord.morningExit || '14:30',
            afternoonEntry: dayRecord.afternoonEntry || '17:00',
            afternoonExit: dayRecord.afternoonExit || '20:00',
            dutyHours: dayRecord.dutyHours || '07:00',
            presence: '0:00',
            workTime: '0:00',
            morningDelay: '0:00',
            morningEarlyExit: '0:00',
            afternoonEarlyExit: '0:00',
            unauthorizedDelay: '0:00',
            holidayOvertime: '0:00',
            finalWorkTime: '0:00',
            leaveDuty: '0:00',
            leaveTime: dayRecord.leaveTime || '0:00',
            missionTime: dayRecord.missionTime || '0:00',
            punchesCount: 4,
            status: dayRecord.status || 'کاری',
            overtime: '0:00',
            deficit: '0:00',
            ...dayRecord
        };
    }

    const calculatedRecord = recalculateDayRecord(baseRecord);
    
    let updatedRecords: TimesheetDayRecord[];
    if (existingIndex >= 0) {
        updatedRecords = sheet.records.map((r, i) => i === existingIndex ? calculatedRecord : r);
    } else {
        updatedRecords = [...sheet.records, calculatedRecord].sort((a, b) => a.date.localeCompare(b.date));
    }

    const updatedSummary = recalculateTimesheetSummary(updatedRecords);

    return {
        ...sheet,
        records: updatedRecords,
        summary: updatedSummary,
        lastUpdated: new Date().toISOString()
    };
}

export interface WebhookFetchResult {
    success: boolean;
    isWebhookInactive?: boolean;
    data?: EmployeeTimesheet | EmployeeTimesheet[];
    rawText?: string;
    message: string;
}

/**
 * Attempts to fetch live timesheet data from n8n webhook API
 */
export async function fetchLiveTimesheetFromWebhook(params?: { employeeId?: string; month?: string }): Promise<WebhookFetchResult> {
    try {
        let url = TIMESHEET_API_URL;
        const queryParams = new URLSearchParams();
        if (params?.employeeId) queryParams.append('employee_id', params.employeeId);
        if (params?.month) queryParams.append('month', params.month);

        const qs = queryParams.toString();
        if (qs) url += `?${qs}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/csv, text/plain, */*'
            }
        });

        if (response.status === 404) {
            const text = await response.text();
            let parsedError = null;
            try { parsedError = JSON.parse(text); } catch { /* ignore */ }

            return {
                success: false,
                isWebhookInactive: true,
                message: parsedError?.message || 'وب‌هوک n8n هنوز در سرور فعال (Active) نشده است.'
            };
        }

        if (!response.ok) {
            return {
                success: false,
                message: `خطای سرور با کد وضعیت ${response.status}`
            };
        }

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const json = await response.json();
            // Handle if JSON returns raw csv string in a property or direct records
            if (typeof json === 'string') {
                const sheet = parseTimesheetCSV(json);
                sheet.source = 'api';
                return { success: true, data: sheet, message: 'اطلاعات با موفقیت از وب‌هوک دریافت شد.' };
            }
            if (json.csv) {
                const sheet = parseTimesheetCSV(json.csv);
                sheet.source = 'api';
                return { success: true, data: sheet, message: 'اطلاعات با موفقیت از وب‌هوک دریافت شد.' };
            }
            // If structured JSON
            if (json.records && Array.isArray(json.records)) {
                const sheet: EmployeeTimesheet = {
                    id: json.id || `ts_${Date.now()}`,
                    organization: json.organization || 'حسینی خودرو شیراز',
                    title: json.title || 'گزارش تردد و کارکرد پرسنل',
                    startDate: json.startDate || '',
                    endDate: json.endDate || '',
                    employeeName: json.employeeName || 'پرسنل',
                    employeeCode: json.employeeCode || '1',
                    records: json.records,
                    summary: json.summary || {
                        totalDuty: '0',
                        totalPresence: '0',
                        totalWorkTime: '0',
                        totalMorningDelay: '0',
                        totalMorningEarlyExit: '0',
                        totalAfternoonEarlyExit: '0',
                        totalUnauthorizedDelay: '0',
                        totalHolidayOvertime: '0',
                        totalFinalWorkTime: '0',
                        totalLeaveDuty: '0',
                        totalLeaveTime: '0',
                        totalMissionTime: '0',
                        totalOvertime: '0',
                        totalDeficit: '0',
                        workDaysCount: json.records.filter((r: any) => r.status?.includes('کاری')).length,
                        holidayDaysCount: json.records.filter((r: any) => r.status?.includes('تعطیل')).length,
                        leaveDaysCount: json.records.filter((r: any) => r.status?.includes('مرخصی')).length,
                        totalPunches: json.records.reduce((acc: number, r: any) => acc + (r.punchesCount || 0), 0)
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'api'
                };
                return { success: true, data: sheet, message: 'اطلاعات با موفقیت از وب‌هوک دریافت شد.' };
            }
        }

        // Fallback to text parsing (CSV format)
        const textData = await response.text();
        if (textData && textData.includes('روز هفته')) {
            const sheet = parseTimesheetCSV(textData);
            sheet.source = 'api';
            return { success: true, data: sheet, message: 'گزارش تردد با موفقیت از وب‌هوک دریافت شد.' };
        }

        return {
            success: false,
            rawText: textData,
            message: 'قالب داده‌های بازگشتی وب‌هوک نامعتبر بود.'
        };
    } catch (error: any) {
        return {
            success: false,
            message: error?.message || 'خطای برقراری ارتباط با وب‌هوک تایم‌شیت'
        };
    }
}

/**
 * Formats an employee timesheet back to clean CSV with UTF-8 BOM for Excel
 */
export function exportTimesheetToExcelCSV(sheet: EmployeeTimesheet): void {
    const lines: string[] = [];
    lines.push(`${sheet.organization},,,,,,,,,,,,,,,,,,,,,`);
    lines.push(`${sheet.title},,,,,,,,,,,,,,,,,,,,,`);
    lines.push(`از تاريخ:${sheet.startDate}               تا تاريخ:${sheet.endDate}   ${sheet.employeeName}  کد:${sheet.employeeCode},,,,,,,,,,,,,,,,,,,,,`);
    lines.push('روز هفته,تاريخ,ورود صبح,خروج صبح,ورود عصر,خروج عصر,موظفي,حضور,کارکرد,تاخير صبح,تعج-خروج ص,تعج-خروج ع,تاخير غير مجاز,اض تعطيلي,کارکرد نهائي,موظفی مرخصی,مرخصی,ماموریت,تعداد تردد,وضعیت,ج اضافه کار,ج  کسر کار');

    sheet.records.forEach(r => {
        lines.push(`${r.dayOfWeek},${r.date},${r.morningEntry},${r.morningExit},${r.afternoonEntry},${r.afternoonExit},${r.dutyHours},${r.presence},${r.workTime},${r.morningDelay},${r.morningEarlyExit},${r.afternoonEarlyExit},${r.unauthorizedDelay},${r.holidayOvertime},${r.finalWorkTime},${r.leaveDuty},${r.leaveTime},${r.missionTime},${r.punchesCount},${r.status},${r.overtime},${r.deficit}`);
    });

    lines.push(',,,,,,,,,,,,,,,,,,,,,');
    lines.push(`مجموع,,,,,,${sheet.summary.totalDuty},${sheet.summary.totalPresence},${sheet.summary.totalWorkTime},${sheet.summary.totalMorningDelay},${sheet.summary.totalMorningEarlyExit},${sheet.summary.totalAfternoonEarlyExit},${sheet.summary.totalUnauthorizedDelay},${sheet.summary.totalHolidayOvertime},${sheet.summary.totalFinalWorkTime},${sheet.summary.totalLeaveDuty},${sheet.summary.totalLeaveTime},${sheet.summary.totalMissionTime},,,${sheet.summary.totalOvertime},${sheet.summary.totalDeficit}`);

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Timesheet_${sheet.employeeName.replace(/\s+/g, '_')}_${sheet.startDate.replace(/\//g, '-')}.csv`;
    link.click();
}

/**
 * Exports all employee timesheets into a single comprehensive Excel (.xlsx) workbook with individual sheets
 */
export function exportAllTimesheetsToExcel(sheets: EmployeeTimesheet[]): void {
    if (!sheets || sheets.length === 0) return;
    const wb = XLSX.utils.book_new();

    sheets.forEach((sheet, idx) => {
        const rows: any[][] = [];
        rows.push([sheet.organization]);
        rows.push([sheet.title]);
        rows.push([`از تاریخ: ${sheet.startDate}`, `تا تاریخ: ${sheet.endDate}`, sheet.employeeName, `کد: ${sheet.employeeCode}`]);
        rows.push([
            'روز هفته', 'تاریخ', 'ورود صبح', 'خروج صبح', 'ورود عصر', 'خروج عصر',
            'موظفی', 'حضور', 'کارکرد', 'تاخیر صبح', 'تعجیل خروج ص', 'تعجیل خروج ع',
            'تاخیر غیرمجاز', 'اضافه تعطیلی', 'کارکرد نهایی', 'موظفی مرخصی', 'مرخصی',
            'ماموریت', 'تعداد تردد', 'وضعیت', 'اضافه کار', 'کسر کار'
        ]);

        sheet.records.forEach(r => {
            rows.push([
                r.dayOfWeek, r.date, r.morningEntry, r.morningExit, r.afternoonEntry, r.afternoonExit,
                r.dutyHours, r.presence, r.workTime, r.morningDelay, r.morningEarlyExit, r.afternoonEarlyExit,
                r.unauthorizedDelay, r.holidayOvertime, r.finalWorkTime, r.leaveDuty, r.leaveTime,
                r.missionTime, r.punchesCount, r.status, r.overtime, r.deficit
            ]);
        });

        rows.push([]);
        rows.push([
            'مجموع', '', '', '', '', '',
            sheet.summary.totalDuty, sheet.summary.totalPresence, sheet.summary.totalWorkTime,
            sheet.summary.totalMorningDelay, sheet.summary.totalMorningEarlyExit, sheet.summary.totalAfternoonEarlyExit,
            sheet.summary.totalUnauthorizedDelay, sheet.summary.totalHolidayOvertime, sheet.summary.totalFinalWorkTime,
            sheet.summary.totalLeaveDuty, sheet.summary.totalLeaveTime, sheet.summary.totalMissionTime,
            '', '', sheet.summary.totalOvertime, sheet.summary.totalDeficit
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const rawName = sheet.employeeName || `کد_${sheet.employeeCode || idx + 1}`;
        const safeName = rawName.substring(0, 28).replace(/[:\\\/\?\*\[\]]/g, '_');
        XLSX.utils.book_append_sheet(wb, ws, safeName);
    });

    XLSX.writeFile(wb, `گزارش_جامع_تردد_پرسنل_حسینی_خودرو_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports the master aggregate summary table of all employees to Excel (.xlsx)
 */
export function exportAggregateSummaryToExcel(sheets: EmployeeTimesheet[]): void {
    if (!sheets || sheets.length === 0) return;
    const wb = XLSX.utils.book_new();

    const rows: any[][] = [];
    rows.push(['حسینی خودرو شیراز - جدول تجمیعی کارکرد، اضافه کار و کسر کار پرسنل']);
    rows.push([`تاریخ تهیه گزارش: ${new Date().toLocaleDateString('fa-IR')} | تعداد پرسنل: ${sheets.length}`]);
    rows.push([]);
    rows.push([
        'ردیف',
        'کد پرسنلی',
        'نام و نام خانوادگی',
        'دوره کارکرد',
        'روزهای کاری',
        'کارکرد نهایی (ساعت:دقیقه)',
        'مجموع اضافه کار',
        'مجموع کسر کار / تاخیر',
        'موظفی ماهانه',
        'مرخصی استحقاقی',
        'تعداد کل تردد'
    ]);

    let totalWorkMin = 0;
    let totalOvertimeMin = 0;
    let totalDeficitMin = 0;

    sheets.forEach((sheet, idx) => {
        const wMin = parseTimeToMinutes(sheet.summary.totalFinalWorkTime);
        const oMin = parseTimeToMinutes(sheet.summary.totalOvertime);
        const dMin = parseTimeToMinutes(sheet.summary.totalDeficit);
        totalWorkMin += wMin;
        totalOvertimeMin += oMin;
        totalDeficitMin += dMin;

        rows.push([
            idx + 1,
            sheet.employeeCode,
            sheet.employeeName,
            `${sheet.startDate} تا ${sheet.endDate}`,
            sheet.summary.workDaysCount,
            sheet.summary.totalFinalWorkTime || '0:00',
            sheet.summary.totalOvertime || '0:00',
            sheet.summary.totalDeficit || '0:00',
            sheet.summary.totalDuty || '0:00',
            sheet.summary.leaveDaysCount,
            sheet.summary.totalPunches
        ]);
    });

    rows.push([]);
    rows.push([
        'مجموع کل',
        '',
        `${sheets.length} نفر`,
        '',
        '',
        formatMinutesToTime(totalWorkMin),
        formatMinutesToTime(totalOvertimeMin),
        formatMinutesToTime(totalDeficitMin),
        '',
        '',
        ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'لیست تجمیعی کارکرد');
    XLSX.writeFile(wb, `لیست_تجمیعی_کارکرد_پرسنل_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

