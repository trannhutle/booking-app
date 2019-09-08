const gCalendarServices = require("./googleCalendarServices")
const moment = require("moment")
const timzone = require("moment-timezone")
const zone = "Australia/Sydney";
const BookingDate = require("../dataModels/bookingDate");
const BookingEvent = require("../dataModels/bookingEvent");
const DayInfo = require("../dataModels/dayInfo")
const StartWorkingTime = "09:00:00";

const getBookableDays = function (month, year, callback) {
    let monthInfo = getMonthInfo(month, year);
    gCalendarServices.getEventList(monthInfo.start, monthInfo.end, (event) => {
        var eventList = event; // Events on the list will be removed when they are valid
        let bookingDays = [];
        for (i = 1; i <= monthInfo.daysInMonth; i++) {
            // check event is on a day
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

const getAvailableTimeSlot = function(day, month, year, callback){
    let todayStr = `${year}-${formatTwoDigitInt(month)}-${formatTwoDigitInt(day)}`
    let today = getTodayInfo(todayStr);

    console.log(today.endDate)
    console.log(today.startDate)

    gCalendarServices.getEventList(today.startDate, today.endDate, (event) => {
        // Events on the list will be removed when they are valid
        var eventList = event; 
        // Check if the event is on a date
        let result = getEventsInDay(today, eventList);
        eventList = result.eventList;
        var eventsInDay = result.eventsInDay;
        var availableSlots = findAvailableSlotsInDay(today, eventsInDay);
        availableSlots = transformToIsoTime(availableSlots); 
        callback(availableSlots);
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
            e.startTime = timzone.tz(eventStart, zone).format();
            e.endTime = timzone.tz(eventEnd, zone).format();
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

    let startWorkingTime = moment(StartWorkingTime, "HH:mm:sss")
    let prevEventTime = timzone.tz(previousEventTime, "YYYY-MM-DD HH:mm:ss", zone);

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
        // Innitialise the first slot
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
    be.startTime = timzone.tz(startTime, "YYYY-MM-DD HH:mm:ss", zone);
    if (delayInMinute) {
        be.startTime.add(delayInMinute, "minutes");
    }
    be.endTime = be.startTime.clone().add( duration,"minutes").format();
    be.startTime = be.startTime.format();
    return be;
}

function transformToIsoTime(slots){
    let tranformedSlots = [];
    slots.forEach(slot => {
        let s = slot;
        s.startTime = timzone.tz(s.startTime, "YYYY-MM-DD HH:mm:ss", zone).toISOString();
        s.endTime = timzone.tz(s.endTime, "YYYY-MM-DD HH:mm:ss", zone).toISOString();
        tranformedSlots.push(s)
    });
    return tranformedSlots;
}


function getTodayInfo(date) {
    let d = timzone.tz(date, "YYYY-MM-DD", zone).format();
    let starDay = timzone.tz(date + " 09:00:00", "YYYY-MM-DD HH:mm:ss", zone).format();
    let endDay = timzone.tz(date + " 17:00:00", "YYYY-MM-DD HH:mm:ss", zone).format();
    let today = new BookingDate();
    today.date = d;
    today.startDate = starDay;
    today.endDate = endDay;
    return today;
}

function isEventOnDay(eventStart, eventEnd, today) {
    let startTime = timzone.tz(eventStart, "YYYY-MM-DD HH:mm:ss", zone);
    let endTime = timzone.tz(eventEnd, "YYYY-MM-DD HH:mm:ss", zone);

    if (moment(today.date).isSame(startTime, "day") &&
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

    start = timzone.tz(start, "YYYY-MM-DD HH:mm:ss", zone).format();
    end = timzone.tz(end, "YYYY-MM-DD HH:mm:ss", zone).format();
    return { start: start, end: end, daysInMonth: daysInMonth, month: m, year: year }
}

module.exports = {
    getBookableDays,
    getAvailableTimeSlot
}