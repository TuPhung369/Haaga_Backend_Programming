import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from "react";
import {
  Layout,
  Button,
  Modal,
  Form,
  Input,
  Tooltip,
  Select,
  InputRef,
  notification
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  CalendarProps
} from "react-big-calendar";
import moment from "moment";
import { COLORS } from "../utils/constant";
import { useSelector, useDispatch } from "react-redux";
import { setEvents } from "../store/userSlice";
import withDragAndDrop, {
  EventInteractionArgs
} from "react-big-calendar/lib/addons/dragAndDrop";
import { CalendarEvent, RootState } from "../type/types";
import {
  fetchEventsByUserId,
  createEvent,
  updateEvent,
  updateEventSeries,
  deleteEvent
} from "../services/calendarService";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { invertColorWithContrast, getRandomColor } from "../utils/function";
import { handleServiceError } from "../services/baseService";

const TypedCalendar: React.FC<CalendarProps<CalendarEvent, object>> = (
  props
) => <BigCalendar {...props} />;
const Calendar = withDragAndDrop<CalendarEvent>(TypedCalendar);

const { Content } = Layout;
const { Option } = Select;

const CalendarPage: React.FC = () => {
  const localizer = momentLocalizer(moment);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    id: "",
    seriesId: "",
    title: "",
    start: "",
    end: "",
    description: "",
    color: COLORS[0],
    repeat: "none" as "none" | "daily" | "weekly" | "monthly" | "yearly"
  });
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate()
  });

  const { events = [] } = useSelector((state: RootState) => state.user);
  const userId = useSelector(
    (state: RootState) => state.user.userInfo?.id || ""
  );
  const token = useSelector((state: RootState) => state.auth.token || "");
  const dispatch = useDispatch();
  const inputRef = useRef<InputRef>(null);

  const fetchAndUpdateEvents = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const data = await fetchEventsByUserId(userId, token);
      dispatch(setEvents(data.result));
    } catch (error) {
      handleServiceError(error);
      notification.error({
        message: "Failed to Fetch Events",
        description:
          "An error occurred while loading your events. Please try again later."
      });
      dispatch(setEvents([]));
    }
  }, [dispatch, userId, token]);

  // Add this piece of code to track the previous userId
  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    // Check if userId has changed
    if (prevUserIdRef.current !== userId) {
      fetchAndUpdateEvents();
      prevUserIdRef.current = userId;
    } else if (events.length === 0 && userId) {
      fetchAndUpdateEvents();
    }
  }, [userId, fetchAndUpdateEvents, events.length]);

  useEffect(() => {
    if (isModalVisible && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else if (!isModalVisible && inputRef.current) {
      inputRef.current.blur();
    }
  }, [isModalVisible]);

  // Tự động cập nhật End Time khi Start Time thay đổi
  useEffect(() => {
    if (eventDetails.start && (!eventDetails.end || eventDetails.id === "")) {
      // Chỉ cập nhật nếu là sự kiện mới hoặc end time chưa được đặt
      const startMoment = moment(eventDetails.start);
      const endMoment = startMoment.clone().add(30, "minutes");
      setEventDetails((prev) => ({
        ...prev,
        end: endMoment.format("YYYY-MM-DDTHH:mm")
      }));
    }
  }, [eventDetails.start, eventDetails.id, eventDetails.end]);

  const userEvents = useMemo(
    () => events.filter((event) => event.userId === userId),
    [events, userId]
  );

  const generateEventInstances = (
    event: CalendarEvent,
    startRange: Date,
    endRange: Date
  ): CalendarEvent[] => {
    const instances: CalendarEvent[] = [];
    const originalStart = moment(event.start);
    const originalEnd = moment(event.end);
    const duration = originalEnd.diff(originalStart, "minutes");
    const exceptions = event.exceptions || [];

    if (event.repeat === "none" || !event.repeat) {
      if (
        originalStart.toDate() <= endRange &&
        originalEnd.toDate() >= startRange
      ) {
        instances.push({
          ...event,
          start: originalStart.toDate(),
          end: originalEnd.toDate(),
          date: originalStart.toDate(),
          seriesId: event.seriesId || undefined
        });
      }
      return instances;
    }

    const currentStart = originalStart.clone();
    while (currentStart.toDate() <= endRange) {
      const currentEnd = currentStart.clone().add(duration, "minutes");
      const currentStartISO = currentStart.toISOString();
      const isExcluded = exceptions.some(
        (ex) => ex.originalStart === currentStartISO
      );

      if (currentEnd.toDate() >= startRange && !isExcluded) {
        const instanceId = `${event.seriesId}-${currentStartISO}`;
        instances.push({
          ...event,
          id: instanceId,
          seriesId: event.seriesId,
          start: currentStart.toDate(),
          end: currentEnd.toDate(),
          date: currentStart.toDate()
        });
      }

      switch (event.repeat) {
        case "daily":
          currentStart.add(1, "day");
          break;
        case "weekly":
          currentStart.add(1, "week");
          break;
        case "monthly":
          currentStart.add(1, "month");
          break;
        case "yearly":
          currentStart.add(1, "year");
          break;
        default:
          break;
      }
    }
    return instances;
  };

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      let start: Date, end: Date;
      if (Array.isArray(range)) {
        // Handle array of dates (agenda view)
        start = range[0];
        end = range[range.length - 1];
      } else {
        // Handle object with start/end (day, week, month view)
        start = moment(range.start).startOf("day").toDate();
        end = moment(range.end).endOf("day").toDate();
      }

      // Ensure we have a sufficient range for day view
      const rangeStart = moment(start);
      const rangeEnd = moment(end);

      // If the range is less than a day, extend it to full day
      if (rangeEnd.diff(rangeStart, "hours") < 24) {
        start = rangeStart.startOf("day").toDate();
        end = rangeStart.endOf("day").toDate();
      }

      setDateRange({ start, end });
    },
    []
  );

  const computedDisplayEvents = useMemo(() => {
    // Extend the range slightly to ensure we catch all events
    const extendedStart = moment(dateRange.start).subtract(1, "day").toDate();
    const extendedEnd = moment(dateRange.end).add(1, "day").toDate();

    return userEvents.flatMap((event) =>
      generateEventInstances(event, extendedStart, extendedEnd)
    );
  }, [userEvents, dateRange]);

  useEffect(() => {
    setDisplayEvents(computedDisplayEvents);
  }, [computedDisplayEvents]);

  // Thêm CSS cho Agenda view
  useEffect(() => {
    // Thêm CSS để chỉnh sửa lại giao diện của Agenda
    const style = document.createElement("style");
    style.textContent = `
      .rbc-agenda-view table.rbc-agenda-table {
        width: 100%;
      }
      .rbc-agenda-view table.rbc-agenda-table tbody > tr > td:first-child {
        width: 200px;
      }
      .rbc-agenda-view .rbc-agenda-time-cell {
        padding-right: 15px;
      }
      #agenda-header {
        display: none;
      }
      
      /* CSS cho Day và Week view */
      .rbc-event {
        padding: 2px 3px !important;
      }
      .rbc-event-content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      /* Ẩn time range mặc định trong Week view */
      .rbc-time-view .rbc-event .rbc-event-label {
        display: none !important;
      }
      
      /* Tùy chỉnh hiển thị event trong Week view */
      .rbc-time-view .rbc-event {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
      }
      
      /* Tùy chỉnh nội dung event trong Week view */
      .rbc-time-view .rbc-event-content {
        width: 100% !important;
        text-align: center !important;
        line-height: 1.2 !important;
      }
      
      /* Responsive font size cho event dựa vào kích thước */
      .rbc-event.rbc-event-allday .rbc-event-content,
      .rbc-event.rbc-event-continues-prior .rbc-event-content,
      .rbc-event.rbc-event-continues-after .rbc-event-content {
        font-size: 10px;
      }
      
      /* Đảm bảo tooltip hiển thị đúng */
      .ant-tooltip {
        max-width: 300px;
      }
      .ant-tooltip-inner {
        word-wrap: break-word;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(eventDetails.id, token);
      await fetchAndUpdateEvents();
      setIsModalVisible(false);
      notification.success({
        message: "Event Deleted",
        description: "The event has been successfully deleted."
      });
    } catch (error) {
      handleServiceError(error);
      notification.error({
        message: "Failed to Fetch Events",
        description:
          "An error occurred while loading your events. Please try again later."
      });
    }
  };

  const handleAddOrUpdateEvent = async () => {
    if (isSaving) return; // Prevent multiple submissions

    const startDate = new Date(eventDetails.start);
    const endDate = new Date(eventDetails.end);

    // Validate that end time is not before start time
    if (endDate < startDate) {
      notification.error({
        message: "Invalid Time Range",
        description: "End time cannot be earlier than start time."
      });
      return;
    }

    const eventId = eventDetails.id || "";

    setIsSaving(true); // Start loading state

    // Sử dụng moment để định dạng ngày giờ đúng với múi giờ địa phương
    const formattedStart = moment(startDate).format("YYYY-MM-DDTHH:mm:ss");
    const formattedEnd = moment(endDate).format("YYYY-MM-DDTHH:mm:ss");
    const formattedDate = moment(startDate).format("YYYY-MM-DDTHH:mm:ss");

    const newEvent: Omit<CalendarEvent, "id" | "createdAt"> = {
      seriesId:
        eventDetails.repeat !== "none" ? eventDetails.seriesId : undefined,
      title: eventDetails.title,
      start: formattedStart,
      end: formattedEnd,
      date: formattedDate,
      description: eventDetails.description,
      color: eventDetails.color,
      allDay: false,
      repeat: eventDetails.repeat,
      userId,
      exceptions: eventDetails.id
        ? events.find((e) => e.id === eventDetails.id)?.exceptions || []
        : []
    };

    // Debug log
    console.log("Sending event with times:", {
      localStart: eventDetails.start,
      localEnd: eventDetails.end,
      formattedStart,
      formattedEnd,
      timezone: moment().utcOffset() / 60
    });

    try {
      if (eventDetails.id) {
        const originalEvent = events.find((e) => e.id === eventDetails.id);
        if (
          originalEvent &&
          originalEvent.repeat !== "none" &&
          originalEvent.repeat !== eventDetails.repeat
        ) {
          Modal.confirm({
            title: "Update recurring event",
            content:
              "Do you want to apply this change to all events in the series?",
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await updateEventSeries(
                originalEvent.seriesId || "",
                newEvent,
                token
              );
              await fetchAndUpdateEvents();
              setIsModalVisible(false);
              notification.success({
                message: "Series Updated",
                description: "All events in the series have been updated."
              });
              setIsSaving(false); // Reset loading state
            },
            onCancel: async () => {
              await updateEvent(eventId, newEvent, token);
              await fetchAndUpdateEvents();
              setIsModalVisible(false);
              notification.success({
                message: "Event Updated",
                description: "The event has been successfully updated."
              });
              setIsSaving(false); // Reset loading state
            }
          });
        } else {
          await updateEvent(eventId, newEvent, token);
          await fetchAndUpdateEvents();
          setIsModalVisible(false);
          notification.success({
            message: "Event Updated",
            description: "The event has been successfully updated."
          });
        }
      } else {
        await createEvent(newEvent, token);
        await fetchAndUpdateEvents();
        setIsModalVisible(false);
        notification.success({
          message: "Event Created",
          description: "The event has been successfully created."
        });
      }
    } catch (error) {
      handleServiceError(error);
      notification.error({
        message: "Failed to Save Event",
        description:
          "An error occurred while saving the event. Please try again."
      });
    } finally {
      setIsSaving(false); // Reset loading state
      setEventDetails({
        id: "",
        seriesId: "",
        title: "",
        start: "",
        end: "",
        description: "",
        color: COLORS[0],
        repeat: "none"
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Get a color that is different from the original event color
  const getDistinctColor = (originalColor: string): string => {
    let newColor: string;
    do {
      newColor = getRandomColor();
    } while (newColor === originalColor);
    return newColor;
  };

  const handleEventDrop = async (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;
    const seriesId = event.seriesId || event.id;
    const isRecurring = event.repeat !== "none";

    // Calculate the duration of the original event
    const originalStart = moment(event.start);
    const originalEnd = moment(event.end);
    const duration = originalEnd.diff(originalStart, "minutes");

    // Create new times with timezone handling
    const newStart = moment(start).format("YYYY-MM-DDTHH:mm:ss");
    const newEnd = end
      ? moment(end).format("YYYY-MM-DDTHH:mm:ss")
      : moment(start).add(duration, "minutes").format("YYYY-MM-DDTHH:mm:ss");

    // Debug logging
    console.log("Drop Operation:", {
      originalStart: originalStart.format("YYYY-MM-DD HH:mm:ss"),
      originalEnd: originalEnd.format("YYYY-MM-DD HH:mm:ss"),
      newStart: newStart,
      newEnd: newEnd,
      duration: duration
    });

    try {
      if (isRecurring) {
        Modal.confirm({
          title: "Update recurring event",
          content:
            "Do you want to update this event only or all events in the series?",
          okText: "This event only",
          cancelText: "All events",
          onOk: async () => {
            const masterEvent = events.find(
              (evt) => evt.seriesId === seriesId && evt.repeat !== "none"
            );
            if (!masterEvent) return;

            const instanceStart = moment(event.start);
            const originalStart = instanceStart.toISOString();

            const distinctColor = getDistinctColor(event.color || COLORS[0]);

            const newException: CalendarEvent = {
              ...event,
              id: "", // Let server generate ID
              seriesId: undefined,
              start: newStart,
              end: newEnd,
              date: newStart,
              repeat: "none",
              color: distinctColor
            };

            await createEvent(newException, token);
            const updatedMasterEvent = {
              ...masterEvent,
              exceptions: [...(masterEvent.exceptions || []), { originalStart }]
            };
            await updateEvent(masterEvent.id, updatedMasterEvent, token);
            await fetchAndUpdateEvents();
            notification.success({
              message: "Event Updated",
              description: "The event instance has been updated."
            });
          },
          onCancel: async () => {
            const updatedEvent = {
              ...event,
              start: newStart,
              end: newEnd,
              date: newStart
            };
            await updateEventSeries(seriesId, updatedEvent, token);
            await fetchAndUpdateEvents();
            notification.success({
              message: "Series Updated",
              description: "All events in the series have been updated."
            });
          }
        });
      } else {
        const updatedEvent = {
          ...event,
          start: newStart,
          end: newEnd,
          date: newStart
        };
        await updateEvent(event.id, updatedEvent, token);
        await fetchAndUpdateEvents();
        notification.success({
          message: "Event Moved",
          description: "The event has been successfully moved."
        });
      }
    } catch (error) {
      handleServiceError(error);
      notification.error({
        message: "Failed to Move Event",
        description:
          "An error occurred while moving the event. Please try again."
      });
    }
  };

  const handleEventResize = async (
    args: EventInteractionArgs<CalendarEvent>
  ) => {
    const { event, start, end } = args;
    const seriesId = event.seriesId || event.id;
    const isRecurring = event.repeat !== "none";

    // Use timezone-aware moment objects
    const newStart = start
      ? moment(start).format("YYYY-MM-DDTHH:mm:ss")
      : moment(event.start).format("YYYY-MM-DDTHH:mm:ss");
    const newEnd = moment(end).format("YYYY-MM-DDTHH:mm:ss");

    // Debug logging
    console.log("Resize Operation:", {
      originalStart: moment(event.start).format("YYYY-MM-DD HH:mm:ss"),
      originalEnd: moment(event.end).format("YYYY-MM-DD HH:mm:ss"),
      newStart: newStart,
      newEnd: newEnd,
      durationChange:
        moment(newEnd).diff(moment(newStart), "minutes") -
        moment(event.end).diff(moment(event.start), "minutes")
    });

    try {
      if (isRecurring) {
        Modal.confirm({
          title: "Resize recurring event",
          content:
            "Do you want to resize this event only or all events in the series?",
          okText: "This event only",
          cancelText: "All events",
          onOk: async () => {
            const masterEvent = events.find(
              (evt) => evt.seriesId === seriesId && evt.repeat !== "none"
            );
            if (!masterEvent) return;

            const instanceStart = moment(event.start);
            const originalStart = instanceStart.toISOString();
            const distinctColor = getDistinctColor(event.color || COLORS[0]);

            const newException: CalendarEvent = {
              ...event,
              id: "", // Let server generate ID
              seriesId: undefined,
              start: newStart,
              end: newEnd,
              date: newStart,
              repeat: "none",
              color: distinctColor
            };

            await createEvent(newException, token);
            const updatedMasterEvent = {
              ...masterEvent,
              exceptions: [...(masterEvent.exceptions || []), { originalStart }]
            };
            await updateEvent(masterEvent.id, updatedMasterEvent, token);
            await fetchAndUpdateEvents();
            notification.success({
              message: "Event Resized",
              description: "The event instance has been resized."
            });
          },
          onCancel: async () => {
            const updatedEvent = {
              ...event,
              start: newStart,
              end: newEnd,
              date: newStart
            };
            await updateEventSeries(seriesId, updatedEvent, token);
            await fetchAndUpdateEvents();
            notification.success({
              message: "Series Resized",
              description: "All events in the series have been resized."
            });
          }
        });
      } else {
        const updatedEvent = {
          ...event,
          start: newStart,
          end: newEnd,
          date: newStart
        };
        await updateEvent(event.id, updatedEvent, token);
        await fetchAndUpdateEvents();
        notification.success({
          message: "Event Resized",
          description: "The event has been successfully resized."
        });
      }
    } catch (error) {
      handleServiceError(error);
      notification.error({
        message: "Failed to Resize Event",
        description:
          "An error occurred while resizing the event. Please try again."
      });
    }
  };

  const eventStyleGetter = (
    event: CalendarEvent
  ): { style: React.CSSProperties } => {
    const backgroundColor = event.color || COLORS[0];
    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        color: invertColorWithContrast(backgroundColor),
        border: "none"
      }
    };
  };

  const eventContent = ({ event }: { event: CalendarEvent }) => {
    const eventStart = moment(event.start).format("HH:mm");
    const eventEnd = moment(event.end).format("HH:mm");

    return (
      <Tooltip
        title={
          <>
            <span style={{ color: COLORS[7] }}>{event.description}</span>
            <br />
            <span>
              {eventStart} - {eventEnd}
            </span>
          </>
        }
      >
        <div style={{ width: "100%", height: "100%" }}>
          <span>{event.title}</span>
        </div>
      </Tooltip>
    );
  };

  // Component riêng cho Week view - chỉ hiển thị title
  const weekEvent = ({ event }: { event: CalendarEvent }) => {
    const eventStart = moment(event.start).format("HH:mm");
    const eventEnd = moment(event.end).format("HH:mm");

    return (
      <Tooltip
        title={
          <>
            <span style={{ color: COLORS[7] }}>{event.description}</span>
            <br />
            <span>
              {eventStart} - {eventEnd}
            </span>
          </>
        }
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "12px",
              lineHeight: "1.2",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {event.title}
          </div>
        </div>
      </Tooltip>
    );
  };

  // Component riêng cho Day view - hiển thị Title : Description
  const dayEvent = ({ event }: { event: CalendarEvent }) => {
    const eventStart = moment(event.start).format("HH:mm");
    const eventEnd = moment(event.end).format("HH:mm");

    return (
      <Tooltip
        title={
          <>
            <span style={{ color: COLORS[7] }}>{event.description}</span>
            <br />
            <span>
              {eventStart} - {eventEnd}
            </span>
          </>
        }
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "start"
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              fontSize: "12px",
              lineHeight: "1.2",
              marginBottom: "2px"
            }}
          >
            {event.title} {" - "}{" "}
            <span style={{ fontSize: "11px" }}>{event.description || ""}</span>
          </div>
        </div>
      </Tooltip>
    );
  };

  // Custom agenda format
  const formats = {
    agendaDateFormat: "ddd DD/MM",
    agendaTimeFormat: "HH:mm",
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      return `${moment(start).format("HH:mm")} - ${moment(end).format(
        "HH:mm"
      )}`;
    },
    // Tùy chỉnh định dạng hiển thị event trong time slot
    eventTimeRangeFormat: () => {
      return ""; // Trả về chuỗi rỗng để không hiển thị time range
    }
  };

  // Custom agenda component with title and description columns
  const AgendaEvent = ({ event }: { event: CalendarEvent }) => (
    <div style={{ display: "flex", width: "100%" }}>
      <span style={{ fontWeight: "bold" }}>
        {event.title}
        {"  -  "}
      </span>
      <span style={{ flex: "1" }}>{event.description || ""}</span>
    </div>
  );

  const showEventModal = (event?: CalendarEvent) => {
    const defaultStart = moment();
    const defaultEnd = moment().add(30, "minutes");

    if (event) {
      const originalEvent = events.find(
        (e) =>
          (event.seriesId && e.seriesId === event.seriesId) || e.id === event.id
      );
      if (originalEvent) {
        const startTime = moment(originalEvent.start);
        const endTime = moment(originalEvent.end);
        let adjustedEnd = endTime;
        if (endTime.isBefore(startTime)) {
          adjustedEnd = startTime.clone().add(30, "minutes");
        }
        setEventDetails({
          id: originalEvent.id,
          seriesId: originalEvent.seriesId || "",
          title: originalEvent.title,
          start: startTime.format("YYYY-MM-DDTHH:mm"),
          end: adjustedEnd.format("YYYY-MM-DDTHH:mm"),
          description: originalEvent.description || "",
          color: originalEvent.color || COLORS[0],
          repeat: originalEvent.repeat || "none"
        });
      }
    } else {
      setEventDetails({
        id: "",
        seriesId: "",
        title: "",
        start: defaultStart.format("YYYY-MM-DDTHH:mm"),
        end: defaultEnd.format("YYYY-MM-DDTHH:mm"),
        description: "",
        color: getRandomColor(),
        repeat: "none"
      });
    }
    setIsModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content
        style={{
          minHeight: "85vh"
        }}
      >
        <div
          style={{
            padding: "24px",
            background: COLORS[12],
            minHeight: "85vh",
            minWidth: 900
          }}
        >
          <Button
            type="primary"
            className="p-2 bg-blue-500 text-white rounded-full shadow-md"
            icon={<PlusOutlined style={{ fontSize: "16px" }} />}
            onClick={() => showEventModal()}
            style={{ marginBottom: "20px" }}
          >
            Add Event
          </Button>

          {/* Title và Description cho Agenda view */}
          <div
            id="agenda-header"
            style={{
              display: "flex",
              width: "100%",
              backgroundColor: "#f5f5f5",
              padding: "8px",
              marginBottom: "8px",
              fontWeight: "bold"
            }}
          >
            <div style={{ flex: "0 0 200px" }}>Date/Time</div>
            <div style={{ flex: "1" }}>Title</div>
            <div style={{ flex: "1" }}>Description</div>
          </div>

          <Calendar
            localizer={localizer}
            events={displayEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650 }}
            draggableAccessor={() => true}
            resizableAccessor={() => true}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onDoubleClickEvent={(event) => showEventModal(event)}
            eventPropGetter={eventStyleGetter}
            formats={formats}
            components={{
              event: eventContent,
              agenda: {
                event: AgendaEvent
              },
              day: {
                event: dayEvent
              },
              week: {
                event: weekEvent
              }
            }}
            tooltipAccessor={null}
            onRangeChange={handleRangeChange}
            defaultView="month"
            min={moment().startOf("day").set("hour", 7).toDate()} // Start at 7 AM
            max={moment().endOf("day").set("hour", 22).toDate()} // End at 10 PM
            step={30} // 30 minute intervals
            timeslots={2} // Show 2 slots per step (15 minute divisions)
            dayLayoutAlgorithm="no-overlap" // Improves day/week view layout
            longPressThreshold={10} // Make drag operations more responsive
            onView={(view) => {
              // Hiển thị hoặc ẩn header của Agenda
              const agendaHeader = document.getElementById("agenda-header");
              if (agendaHeader) {
                agendaHeader.style.display =
                  view === "agenda" ? "flex" : "none";
              }
            }}
          />

          <Modal
            title={eventDetails.id ? "Edit Event" : "Add Event"}
            open={isModalVisible}
            onCancel={() => {
              if (!isSaving) {
                setIsModalVisible(false);
              }
            }}
            onOk={handleAddOrUpdateEvent}
            afterClose={() => {
              if (inputRef.current) inputRef.current.blur();
            }}
            footer={[
              <div className="flex justify-between w-full" key="footer">
                {eventDetails.id && (
                  <Button
                    className="bg-red-500 text-white p-2 rounded-md mr-2 hover:bg-red-600 transition"
                    key="delete"
                    onClick={handleDeleteEvent}
                    style={{ marginRight: 8 }}
                    disabled={isSaving}
                  >
                    Delete
                  </Button>
                )}
                <div className="flex space-x-2">
                  <Button
                    key="cancel"
                    onClick={() => setIsModalVisible(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    key="submit"
                    type="primary"
                    onClick={handleAddOrUpdateEvent}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    {eventDetails.id ? "Update" : "Save"}
                  </Button>
                </div>
              </div>
            ]}
          >
            <Form layout="vertical">
              <Form.Item label="Event Title">
                <Input
                  ref={inputRef}
                  name="title"
                  value={eventDetails.title}
                  onChange={handleInputChange}
                  placeholder="Enter event title"
                />
              </Form.Item>
              <Form.Item label="Start Date and Time">
                <Input
                  name="start"
                  type="datetime-local"
                  value={eventDetails.start}
                  onChange={handleInputChange}
                />
              </Form.Item>
              <Form.Item label="End Date and Time">
                <Input
                  name="end"
                  type="datetime-local"
                  value={eventDetails.end}
                  onChange={handleInputChange}
                  min={eventDetails.start}
                />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea
                  name="description"
                  value={eventDetails.description}
                  onChange={handleInputChange}
                />
              </Form.Item>
              <Form.Item label="Repeat">
                <Select
                  value={eventDetails.repeat}
                  onChange={(value) =>
                    setEventDetails((prev) => ({ ...prev, repeat: value }))
                  }
                >
                  <Option value="none">No Repeat</Option>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="yearly">Yearly</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Color">
                <Select
                  value={eventDetails.color}
                  onChange={(value) =>
                    setEventDetails((prev) => ({ ...prev, color: value }))
                  }
                  style={{ width: "100%" }}
                >
                  {COLORS.map((color, index) => (
                    <Option key={index} value={color}>
                      <div
                        style={{
                          backgroundColor: color,
                          width: "100%",
                          height: "20px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: invertColorWithContrast(color)
                        }}
                      >
                        {color}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default CalendarPage;

