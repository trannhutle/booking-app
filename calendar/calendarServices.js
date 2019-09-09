const gCalendarServices = require("./googleCalendarServices")
const moment = require("moment")
// const zone = "Australia/Sydney";
const BookingDate = require("../dataModels/bookingDate");
const BookingEvent = require("../dataModels/bookingEvent");
const DayInfo = require("../dataModels/dayInfo")
const StartWorkingTime = "09:00:00";
const EndWorkingTime = "17:00:00";

const getBookableDays = function (month, year, callback) {
    let monthInfo = getMonthInfo(month, year);
    gCalendarServices.getEventList(monthInfo.start, monthInfo.end, (isSuccess, event) => {
        var eventList = event; // Events on the list will be removed when they are valid
        let bookingDays = [];
        for (i = 1; i <= monthInfo.daysInMonth; i++) {
            // check event is on a dayutcNow
            let d = formatTwoDigitInt(i);
            let today = getTodayInfo(`${monthInfo.year}-${monthInfo.month}-${d}`);

            // Check if the event is on a date
            let result = getEventsInDay(today, eventList);
            eventList = result.eventList;
            var eventsInDay = result.eventsInDay;
            let availableSlots = findAvailableSlotsInDay(today, eventsInDay);
            let hasTimeSlot = false;
            if (availableSlots.length > 0) {
                hasTimeSlot = true;
            }
            console.log(availableSlots);
            let dInfo = new DayInfo();
            dInfo.day = i;
            dInfo.hasTimeSlots = hasTimeSlot;
            bookingDays.push(dInfo);
        }
        callback(bookingDays);
    })
}

const getAvailableTimeSlot = function (day, month, year, callback) {
    let todayStr = `${year}-${formatTwoDigitInt(month)}-${formatTwoDigitInt(day)}`
    let today = getTodayInfo(todayStr);

    gCalendarServices.getEventList(today.startDate, today.endDate, (isSuccess, event) => {
        // Events on the list will be removed when they are valid
        var eventList = event;
        // Check if the event is on a date
        let result = getEventsInDay(today, eventList);
        eventList = result.eventList;
        var eventsInDay = result.eventsInDay;
        var availableSlots = findAvailableSlotsInDay(today, eventsInDay);
        callback(availableSlots);
    })
}

const checkTimeslotIsValid = function (slot, callback) {
    let startTime = moment.utc(`${slot.year}-${slot.month}-${slot.day}T${slot.hour}:${slot.minute}`, moment.HTML5_FMT.DATETIME_LOCAL);
    console.log("aaa");

    if (!isEventOnBussinessDays(startTime)) {
        return callback(false, "Cannot book outside bookable timeframe", [])
    }
    let diff = moment(startTime).diff(moment.utc(), "minutes")
    // exact 24 hour
    console.log("bbb");
    console.log("diff: " + diff);
    if (diff <= 1440) {
        console.log("ccc");
        return callback(false, "Cannot book with less than 24 hours in advance", [])
    }
    console.log("ddd");
    console.log("slot.day:" + slot.day);
    console.log("slot.month:" + slot.month);
    console.log("slot.year:" + slot.year );
    getAvailableTimeSlot(slot.day, slot.month, slot.year, (data) => {
        let timeSlots = data;
        console.log(data);
        if (timeSlots.length == 0) {
            return callback(false, "Invalid time slot", [])
        }
        var foundItem = false;

        for (var i = 0; i < timeSlots.length; i++){
            let bookedSlot = timeSlots[i];
            let start = moment.utc(bookedSlot.startTime, moment.ISO_8601);
            if (startTime.isSame(start)) {
                console.log("Found the slot");
                foundItem = true;
                break;
            }
        }
        if (!foundItem) {
            return callback(false, "Invalid time slot", [])
        } else {
            let endTime = startTime.clone().add(40, "minutes");
            
            gCalendarServices.insertEvent(startTime.toISOString(), endTime.toISOString(), (isSuccess, data) => {
                if (isSuccess) {
                    console.log(data);
                    return callback(true, "Add new booking successfully", {
                        startTime: data.data.start.dateTime,
                        endTime: data.data.end.dateTime
                    })
                } else {
                    return callback(false, "Insert new booking unsucessfully", [])
                }
            })
        }
    })
}
function getEventsInDay(today, eventList) {
    let eventsInDay = [];
    eventList = eventList.filter((event, i) => {
        let eventStart = event.start.dateTime || event.start.date;
        let eventEnd = event.end.dateTime || event.end.date;
        if (isEventOnDay(eventStart, eventEnd, today)) {
            console.log("There is an vaid event on a day")
            let e = new BookingEvent();
            e.startTime = moment.utc(eventStart, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).format();
            e.endTime = moment.utc(eventEnd, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).format();
            eventsInDay.push(e);
            return false;
        }
        return true
    })
    return { eventList: eventList, eventsInDay: eventsInDay }
}

function findAvailableSlotsInDay(today, bookedEvents) {
    var events = bookedEvents;
    var availableSlots = [];
    if (events.length > 0) {
        console.log("There are booked events: " + events.length);
        // Sort by time ascending
        events = events.sort((a, b) => {
            if (moment(a.endTime).isSameOrBefore(b.startTime)) {
                return -1;
            }
            if (moment(a.startTime).isSameOrAfter(b.endTime)) {
                return 1;
            }
            return 0;
        });

        // Find slots from start to the first booking slot                
        let firstBookedEvent = events[0];
        availableSlots = findNextAvaiableSLots(today.startDate, today.startDate, firstBookedEvent.startTime)
        // console.log("There are slots from the beginning to the first booking " + availableSlots);

        // Find slots in the booked slots
        for (var ii = 0; ii < events.length; ii++) {
            let bookedEvent = events[ii];
            if ((ii + 1) < events.length) {
                utcNow
                //
                if (availableSlots.length > 0) {
                    lastEventEndTime = availableSlots[availableSlots.length - 1].endTime;
                } else {
                    lastEventEndTime = bookedEvent.endTime;
                }// Set default to the begining of the day when there is no previsous events

                let nextBookedEvent = events[ii + 1]
                let availableLotsBetweenBookings = findNextAvaiableSLots(lastEventEndTime, bookedEvent.endTime, nextBookedEvent.startTime);
                availableSlots = availableSlots.concat(availableLotsBetweenBookings);
                // console.log("There are some slots in the middle of the bookings" + availableLotsBetweenBookings);
            }
        }

        // Find slots from start to the first booking slot
        let lastBookingEvent = events[events.length - 1];
        let availableLotsAfterBookings = findNextAvaiableSLots(lastBookingEvent.endTime, lastBookingEvent.endTime, today.endDate)
        availableSlots = availableSlots.concat(availableLotsAfterBookings);
        // console.log("There are slots after the last booking " + availableLotsAfterBookings);

    } else {
        console.log("There is no booked event on " + today.date);
        availableSlots = findNextAvaiableSLots(today.startDate, today.startDate, today.endDate)
        // console.log("Return all available slots in a day: " + availableSlots);
    }

    return availableSlots;
}

function needABreak(previousEventTime, currentEventTime) {
    let startWorkingTime = moment.utc(StartWorkingTime, moment.HTML5_FMT.TIME_SECONDS)
    let prevEventTime = moment.utc(previousEventTime, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
    console.log(startWorkingTime)
    console.log(prevEventTime)
    // It does not need a break at the begining of the day
    if (startWorkingTime.hour() == prevEventTime.hour() && startWorkingTime.minutes() == prevEventTime.minutes()) {
        return false;
    }
    let diffToNextEvent = prevEventTime.diff(currentEventTime, "minutes")
    if (diffToNextEvent <= 5) {
        return true;
    }
    return false;
}

function findNextAvaiableSLots(lastEventEndTime, startAvailableTime, endAvailableTime) {
    let availableSlots = [];
    let diffToNextEvent = moment(endAvailableTime).diff(startAvailableTime, "minutes");
    console.log("Difftime: " + diffToNextEvent)
    let isNeedABreak = needABreak(lastEventEndTime, startAvailableTime);
    console.log("isNeedABreak: " + isNeedABreak);

    if (diffToNextEvent > 45) {
        var breakTime = 5;
        if (!isNeedABreak) {
            breakTime = 0;
        }
        // Innitialise the first slot`
        var slot = createNewBookingSlot(startAvailableTime, breakTime, 40)
        while (moment(slot.startTime).isBefore(endAvailableTime) && moment(slot.endTime).isBefore(endAvailableTime)) {
            // console.log(slot);
            availableSlots.push(slot);
            slot = createNewBookingSlot(slot.endTime, 5, 40);
            // console.log("endAvailableTime: " + endAvailableTime)
            // console.log("slot.endTime: " + slot.endTime)
        }
    }
    return availableSlots
}

function createNewBookingSlot(startTime, delayInMinute, duration) {
    let be = new BookingEvent();
    be.startTime = moment.utc(startTime, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
    if (delayInMinute) {
        be.startTime.add(delayInMinute, "minutes");
    }
    be.endTime = be.startTime.clone().add(duration, "minutes").format();
    be.startTime = be.startTime.format();
    return be;
}

function getTodayInfo(date) {
    let d = moment.utc(date, "YYYY-MM-DD").format();
    let starDay = moment.utc(date + " 09:00:00", moment.ISO_8601).format();
    let endDay = moment.utc(date + " 17:00:00", moment.ISO_8601).format();
    let today = new BookingDate();
    today.date = d;
    today.startDate = starDay;
    today.endDate = endDay;
    return today;
}

function isEventOnBussinessDays(day) {
    let weekDay = day.isoWeekday();
    if (weekDay == 6 || weekDay == 7) {
        console.log("Input day is on weekend")
        return false;
    }

    let requestTime = day.clone().format(moment.HTML5_FMT.TIME_SECONDS)
    if (moment(StartWorkingTime, moment.HTML5_FMT.TIME_SECONDS).isAfter(requestTime) || moment(EndWorkingTime, moment.HTML5_FMT.TIME_SECONDS).isBefore(requestTime)) {
        console.log("Invalid working time");
        return false;
    }
    return true;
}

function isEventOnDay(eventStart, eventEnd, today) {
    let startTime = moment.utc(eventStart, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
    let endTime = moment.utc(eventEnd, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
    if (startTime.isSame(today.date, "day") &&
        startTime.isSameOrAfter(today.startDate) && endTime.isSameOrBefore(today.endDate)) return true;
    return false;
}

function getDaysMonth(month, year) {
    // Day 0 is the last day in the previous month
    var days = new Date(year, month, 0).getDate();
    return formatTwoDigitInt(days);
}

function formatTwoDigitInt(number) {
    return ("0" + number).slice(-2);
}

function getMonthInfo(month, year) {
    const daysInMonth = parseInt(getDaysMonth(month, year));
    const m = formatTwoDigitInt(month);

    var start = `${year}-${m}-01 09:00:00`;
    var end = `${year}-${m}-${daysInMonth} 17:00:00`;

    start = moment.utc(start, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).format();
    end = moment.utc(end, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).format();
    return { start: start, end: end, daysInMonth: daysInMonth, month: m, year: year }
}

module.exports = {
    getBookableDays,
    getAvailableTimeSlot,
    checkTimeslotIsValid
}