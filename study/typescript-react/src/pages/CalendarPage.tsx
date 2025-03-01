import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
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
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  CalendarProps,
} from "react-big-calendar";
import moment from "moment";
import { COLORS } from "../utils/constant";
import { useSelector, useDispatch } from "react-redux";
import { setEvents } from "../store/userSlice";
import withDragAndDrop, {
  EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { CalendarEvent, RootState } from "../type/types";
import {
  fetchEventsByUserId,
  createEvent,
  updateEvent,
  updateEventSeries,
  deleteEvent,
} from "../services/calendarService";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { invertColorWithContrast, getRandomColor } from "../utils/function";

const TypedCalendar: React.FC<CalendarProps<CalendarEvent, object>> = (
  props
) => <BigCalendar {...props} />;
const Calendar = withDragAndDrop<CalendarEvent>(TypedCalendar);

const { Content } = Layout;
const { Option } = Select;

const CalendarPage: React.FC = () => {
  const localizer = momentLocalizer(moment);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    id: "",
    seriesId: "",
    title: "",
    start: "",
    end: "",
    description: "",
    color: COLORS[0],
    repeat: "none" as "none" | "daily" | "weekly" | "monthly" | "yearly",
  });
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate(),
  });

  const { events = [] } = useSelector((state: RootState) => state.user);
  const userId = useSelector(
    (state: RootState) => state.user.userInfo?.id || ""
  );
  const token = useSelector((state: RootState) => state.auth.token || "");
  const dispatch = useDispatch();
  const inputRef = useRef<InputRef>(null);

  // Hàm fetch lại dữ liệu từ API và lưu vào Redux
  const fetchAndUpdateEvents = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const data = await fetchEventsByUserId(userId, token);
      dispatch(setEvents(data.result));
    } catch (error) {
      console.error("Error fetching events:", error);
      dispatch(setEvents([]));
    }
  }, [dispatch, userId, token]);

  // Khởi tạo dữ liệu từ API
  useEffect(() => {
    fetchAndUpdateEvents();
  }, [fetchAndUpdateEvents]);

  useEffect(() => {
    if (isModalVisible && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else if (!isModalVisible && inputRef.current) {
      inputRef.current.blur();
    }
  }, [isModalVisible]);

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
          seriesId: event.seriesId || undefined,
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
          date: currentStart.toDate(),
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

  const computedDisplayEvents = useMemo(() => {
    return userEvents.flatMap((event) =>
      generateEventInstances(event, dateRange.start, dateRange.end)
    );
  }, [userEvents, dateRange]);

  useEffect(() => {
    setDisplayEvents(computedDisplayEvents);
  }, [computedDisplayEvents]);

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      let start: Date, end: Date;
      if (Array.isArray(range)) {
        start = range[0];
        end = range[range.length - 1];
      } else {
        start = range.start;
        end = range.end;
      }
      setDateRange({ start, end });
    },
    []
  );

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(eventDetails.id, token);
      await fetchAndUpdateEvents();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleAddOrUpdateEvent = async () => {
    const startDate = new Date(eventDetails.start);
    const endDate = new Date(eventDetails.end);
    const eventId = eventDetails.id || "";

    const newEvent: Omit<CalendarEvent, "id" | "createdAt"> = {
      seriesId:
        eventDetails.repeat !== "none" ? eventDetails.seriesId : undefined,
      title: eventDetails.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      date: startDate.toISOString(),
      description: eventDetails.description,
      color: eventDetails.color,
      allDay: false,
      repeat: eventDetails.repeat,
      userId,
      exceptions: eventDetails.id
        ? events.find((e) => e.id === eventDetails.id)?.exceptions || []
        : [],
    };

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
            },
            onCancel: async () => {
              await updateEvent(eventId, newEvent, token);
              await fetchAndUpdateEvents();
              setIsModalVisible(false);
            },
          });
        } else {
          await updateEvent(eventId, newEvent, token);
          await fetchAndUpdateEvents();
          setIsModalVisible(false);
        }
      } else {
        await createEvent(newEvent, token);
        await fetchAndUpdateEvents();
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }

    setEventDetails({
      id: "",
      seriesId: "",
      title: "",
      start: "",
      end: "",
      description: "",
      color: COLORS[0],
      repeat: "none",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventDrop = async (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;
    const seriesId = event.seriesId || event.id;
    const isRecurring = event.repeat !== "none";

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

          const newException: CalendarEvent = {
            ...event,
            id: "", // Để server tạo ID
            seriesId: undefined,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            date: new Date(start).toISOString(),
            repeat: "none",
          };

          await createEvent(newException, token);
          const updatedMasterEvent = {
            ...masterEvent,
            exceptions: [...(masterEvent.exceptions || []), { originalStart }],
          };
          await updateEvent(masterEvent.id, updatedMasterEvent, token);
          await fetchAndUpdateEvents(); // Lấy lại dữ liệu từ API
        },
        onCancel: async () => {
          const updatedEvent = {
            ...event,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            date: new Date(start).toISOString(),
          };
          await updateEventSeries(seriesId, updatedEvent, token);
          await fetchAndUpdateEvents(); // Lấy lại dữ liệu từ API
        },
      });
    } else {
      const updatedEvent = {
        ...event,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        date: new Date(start).toISOString(),
      };
      await updateEvent(event.id, updatedEvent, token);
      await fetchAndUpdateEvents(); // Lấy lại dữ liệu từ API
    }
  };

  const handleEventResize = async (
    args: EventInteractionArgs<CalendarEvent>
  ) => {
    const { event, start, end } = args;
    const seriesId = event.seriesId || event.id;
    const isRecurring = event.repeat !== "none";

    if (isRecurring) {
      Modal.confirm({
        title: "Resize recurring event",
        content:
          "Do you want to resize this event only or all events in the series?",
        okText: "This event only",
        cancelText: "All events",
        onOk: async () => {
          const newException: CalendarEvent = {
            ...event,
            id: "", // Để server tạo ID
            seriesId: undefined,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            date: new Date(start).toISOString(),
            repeat: "none",
          };
          await createEvent(newException, token);
          await fetchAndUpdateEvents(); // Lấy lại dữ liệu từ API
        },
        onCancel: async () => {
          const updatedEvent = {
            ...event,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            date: new Date(start).toISOString(),
          };
          await updateEventSeries(seriesId, updatedEvent, token);
          await fetchAndUpdateEvents(); // Lấy lại dữ liệu từ API
        },
      });
    } else {
      const updatedEvent = {
        ...event,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        date: new Date(start).toISOString(),
      };
      await updateEvent(event.id, updatedEvent, token);
      await fetchAndUpdateEvents(); // Lấy lại dữ liệu từ API
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
        border: "none",
      },
    };
  };

  const eventContent = ({ event }: { event: CalendarEvent }) => {
    return (
      <Tooltip
        title={
          <>
            <span
              style={{
                color: COLORS[12],
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {event.title}
            </span>
            <br />
            <span style={{ color: COLORS[7] }}>{event.description}</span>
          </>
        }
      >
        <span>{event.title}</span>
      </Tooltip>
    );
  };

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
          repeat: originalEvent.repeat || "none",
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
        repeat: "none",
      });
    }
    setIsModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content
        style={{ padding: "0 50px", marginTop: "16px", minHeight: "85vh" }}
      >
        <div
          style={{
            padding: "24px",
            background: COLORS[12],
            minHeight: "85vh",
            minWidth: 900,
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
            components={{ event: eventContent }}
            tooltipAccessor={null}
            onRangeChange={handleRangeChange}
            defaultView="month"
          />

          <Modal
            title={eventDetails.id ? "Edit Event" : "Add Event"}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
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
                  >
                    Delete
                  </Button>
                )}
                <div className="flex space-x-2">
                  <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    key="submit"
                    type="primary"
                    onClick={handleAddOrUpdateEvent}
                  >
                    {eventDetails.id ? "Update" : "Save"}
                  </Button>
                </div>
              </div>,
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
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default CalendarPage;

