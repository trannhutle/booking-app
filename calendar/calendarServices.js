const gCalendarServices = require("./googleCalendarServices")
const moment = require("moment")
const BookingDate = require("../dataModels/bookingDate");
const BookingEvent = require("../dataModels/bookingEvent");
const DayInfo = require("../dataModels/dayInfo")
const appConfig = require("../appConfig")

//ANCHOR  Get bookable days on a month
const getBookableDays = function (month, year, callback) {
    let monthInfo = getMonthInfo(month, year);
    gCalendarServices.getEventList(monthInfo.start, monthInfo.end, (isSuccess, event) => {
        var eventList = event;
        let bookingDays = [];
        if (isSuccess) {
            for (i = 1; i <= monthInfo.daysInMonth; i++) {
                // check event is on a dayutcNow
                let d = formatTwoDigitInt(i);
                let today = getTodayInfo(`${monthInfo.year}-${monthInfo.month}-${d}`);

                // Check if the event is on a date
                let result = getEventsInDay(today, eventList);
                eventList = result.eventList;
                var eventsInDay = result.eventsInDay;

                // Find available slots on one day
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
        } else {
            console.log("There is an error while calling google API")
        }
        callback(bookingDays);
    })
}

//ANCHOR  Used for get the available timeslot on a specific day. 
const getAvailableTimeSlot = function (day, month, year, callback) {
    let todayStr = `${year}-${formatTwoDigitInt(month)}-${formatTwoDigitInt(day)}`
    let today = getTodayInfo(todayStr);

    gCalendarServices.getEventList(today.startDate, today.endDate, (isSuccess, event) => {
        var availableSlots = []
        if (isSuccess) {
            // Get events on a day
            var eventList = event;
            let result = getEventsInDay(today, eventList);
            eventList = result.eventList;
            let eventsInDay = result.eventsInDay;
            // Find available slots on a day
            availableSlots = findAvailableSlotsInDay(today, eventsInDay);
        } else {
            console.log("There is an error while calling to google API")
        }
        callback(availableSlots);
    })
}
// ANCHOR Book a new timeslot on google calendar
const bookTimeslot = function (slot, callback) {
    let startTime = moment.utc(`${slot.year}-${slot.month}-${slot.day}T${slot.hour}:${slot.minute}`, moment.HTML5_FMT.DATETIME_LOCAL);
    if (!isEventOnBussinessDays(startTime)) {
        return callback(false, "Cannot book outside bookable timeframe", null)
    }
    // Check 24hours before the available time slot
    let diff = moment(startTime).diff(moment.utc(), "minutes")
    if (diff <= 0) {
        return callback(false, "Cannot book time in the past", null)
    }
    if (diff <= appConfig.DayInMinute) {
        return callback(false, "Cannot book with less than 24 hours in advance", null)
    }

    // Check the input slot is valid
    getAvailableTimeSlot(slot.day, slot.month, slot.year, (data) => {
        if (data.length != 0) {
            let timeSlots = data;
            //  Check the time slot is valid
            if (!isFoundTimeslot(startTime, timeSlots)) {
                return callback(false, "Invalid time slot", null)
            } else {
                let endTime = startTime.clone().add(appConfig.Duration, "minutes");

                // Insert event into google calendar
                gCalendarServices.insertEvent(startTime.toISOString(), endTime.toISOString(), (isSuccess, data) => {
                    if (isSuccess) {
                        console.log(data);
                        return callback(true, "Add new booking successfully", {
                            startTime: data.data.start.dateTime,
                            endTime: data.data.end.dateTime
                        })
                    } else {
                        return callback(false, "Insert new booking unsucessfully", null)
                    }
                })
            }
        } else {
            return callback(false, "Invalid time slot", null)
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
        events = sortByStartTimeAscending(events);

        // Find slots from start to the first booking slot                
        let firstBookedEvent = events[0];
        availableSlots = findNextAvaiableSLots(today.startDate, today.startDate, firstBookedEvent.startTime)
        // console.log("There are slots from the beginning to the first booking " + availableSlots);

        // Find slots in the booked slots
        for (var ii = 0; ii < events.length; ii++) {
            let bookedEvent = events[ii];
            if ((ii + 1) < events.length) {

                // Get the ending time of the final booking event
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

function sortByStartTimeAscending(events) {
    events = events.sort((a, b) => {
        if (moment(a.endTime).isSameOrBefore(b.startTime)) {
            return -1;
        }
        if (moment(a.startTime).isSameOrAfter(b.endTime)) {
            return 1;
        }
        return 0;
    }); isFoundTimeslot
    return events
}

function needABreak(previousEventTime, currentEventTime) {
    let startWorkingTime = moment.utc(appConfig.StartWorkingTime, moment.HTML5_FMT.TIME_SECONDS)
    let prevEventTime = moment.utc(previousEventTime, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);

    // It does not need a break at the begining of the day
    if (startWorkingTime.hour() == prevEventTime.hour() && startWorkingTime.minutes() == prevEventTime.minutes()) {
        return false;
    }
    let diffToNextEvent = prevEventTime.diff(currentEventTime, "minutes")
    if (diffToNextEvent <= appConfig.BreakTime) {
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

    if (diffToNextEvent > appConfig.TotalMeetingDuration) {

        // If the booked event is just finished, we have to add break time
        var breakTime = appConfig.BreakTime;
        if (!isNeedABreak) {
            breakTime = 0;
        }
        // Innitialise the first slot`
        var slot = createNewBookingSlot(startAvailableTime, breakTime, appConfig.Duration)
        while (moment(slot.startTime).isBefore(endAvailableTime) && moment(slot.endTime).isBefore(endAvailableTime)) {
            // console.log(slot);
            availableSlots.push(slot);
            slot = createNewBookingSlot(slot.endTime, appConfig.BreakTime, appConfig.Duration);
            // console.log("endAvailableTime: " + endAvailableTiisFoundTimeslote)
            // console.log("slot.endTime: " + slot.endTime)
        }
    }
    return availableSlots
}

function createNewBookingSlot(startTime, delayInMinute, duration) {
    let event = new BookingEvent();
    event.startTime = moment.utc(startTime, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
    if (delayInMinute) {
        event.startTime.add(delayInMinute, "minutes");
    }
    event.endTime = event.startTime.clone().add(duration, "minutes").format();
    event.startTime = event.startTime.format();
    return event;
}

function isFoundTimeslot(timeslotStart, timeSlots) {
    for (var i = 0; i < timeSlots.length; i++) {
        let bookedSlot = timeSlots[i];
        let start = moment.utc(bookedSlot.startTime, moment.ISO_8601);
        if (timeslotStart.isSame(start)) {
            console.log("Found the slot");
            foundItem = true;
            return true;
        }
    }
    return false;
}

function isEventOnBussinessDays(day) {
    let weekDay = day.isoWeekday();
    if (weekDay == 6 || weekDay == 7) {
        console.log("Input day is on weekend")
        return false;
    }

    let requestTime = day.clone().format(moment.HTML5_FMT.TIME_SECONDS)

    if (moment(appConfig.StartWorkingTime, moment.HTML5_FMT.TIME_SECONDS).isAfter(moment(requestTime, moment.HTML5_FMT.TIME_SECONDS))
        || moment(appConfig.EndWorkingTime, moment.HTML5_FMT.TIME_SECONDS).isBefore(moment(requestTime, moment.HTML5_FMT.TIME_SECONDS))) {
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
    var days = new Date(year, month, 0).getDate();
    return formatTwoDigitInt(days);
}

function formatTwoDigitInt(number) {
    return ("0" + number).slice(-2);
}

function getMonthInfo(month, year) {
    const daysInMonth = parseInt(getDaysMonth(month, year));
    const m = formatTwoDigitInt(month);
    var startMonth = `${year}-${m}-01 ${appConfig.StartWorkingTime}`; // Month start day example: 2019-08-01 09:00:00
    var endMonth = `${year}-${m}-${daysInMonth} ${appConfig.EndWorkingTime}`;  // Month end example: 2019-08-31 17:00:00

    startMonth = moment.utc(startMonth, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).format();
    endMonth = moment.utc(endMonth, moment.HTML5_FMT.DATETIME_LOCAL_SECONDS).format();
    return { start: startMonth, end: endMonth, daysInMonth: daysInMonth, month: m, year: year }
}

function getTodayInfo(date) {
    let d = moment.utc(date, moment.HTML5_FMT.DATE).format();
    let starDay = moment.utc(`${date} ${appConfig.StartWorkingTime}`, moment.ISO_8601).format(); // Day start day example: 2019-08-01 09:00:00
    let endDay = moment.utc(`${date} ${appConfig.EndWorkingTime}`, moment.ISO_8601).format(); // Day start day example: 2019-08-01 17:00:00
    let today = new BookingDate();
    today.date = d;
    today.startDate = starDay;
    today.endDate = endDay;
    return today;
}

module.exports = {
    getBookableDays,
    getAvailableTimeSlot,
    bookTimeslot
}