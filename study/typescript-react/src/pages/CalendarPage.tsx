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
import { CalendarEvent } from "../type/types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const TypedCalendar: React.FC<CalendarProps<CalendarEvent, object>> = (
  props
) => <BigCalendar {...props} />;
const Calendar = withDragAndDrop<CalendarEvent>(TypedCalendar);

const { Content } = Layout;
const { Option } = Select;

interface RootState {
  user: {
    events: CalendarEvent[];
    isEventsInvalidated: boolean;
    userInfo: {
      id: string;
    };
  };
}

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
  const dispatch = useDispatch();
  const inputRef = useRef<InputRef>(null);
  const userId = useSelector((state: RootState) => state.user.userInfo.id);

  const initializeEvents = useCallback(() => {
    if (events.length === 0) {
      dispatch(setEvents([]));
    }
  }, [dispatch, events.length]);

  const userEvents = useMemo(
    () => events.filter((event) => event.userId === userId),
    [events, userId]
  );

  useEffect(() => {
    initializeEvents();
  }, [initializeEvents]);

  useEffect(() => {
    if (isModalVisible && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!isModalVisible && inputRef.current) {
      inputRef.current.blur();
    }
  }, [isModalVisible]);

  const generateEventInstances = (
    event: CalendarEvent,
    startRange: Date,
    endRange: Date
  ): CalendarEvent[] => {
    const instances: CalendarEvent[] = [];
    const originalStart = moment(event.start); // Thời gian gốc của master event
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

      // Kiểm tra xem occurrence này có bị thay thế bởi exception không
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

  const handleDeleteEvent = () => {
    const updatedEvents = events.filter(
      (event) => event.id !== eventDetails.id
    );
    dispatch(setEvents(updatedEvents));
    setIsModalVisible(false);
  };

  const hexToRgb = (hex: string) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return { r, g, b };
  };

  const getLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };

  const getContrastRatio = (
    bgRgb: { r: number; g: number; b: number },
    textRgb: { r: number; g: number; b: number }
  ): number => {
    const L1 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const L2 = getLuminance(textRgb.r, textRgb.g, textRgb.b);
    const brighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (brighter + 0.05) / (darker + 0.05);
  };

  const rgbToHsl = (
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToRgb = (
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;
    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  const invertColorWithContrast = (
    backgroundColor: string,
    minContrast = 7
  ): string => {
    const bgRgb = hexToRgb(backgroundColor);
    const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);
    const newHue = (bgHsl.h + 180) % 360;
    const newSaturation = Math.min(100, bgHsl.s + 30);
    let newLightness = bgHsl.l;
    const initialTextRgb = hslToRgb(newHue, newSaturation, newLightness);
    let contrast = getContrastRatio(bgRgb, initialTextRgb);
    while (contrast < minContrast) {
      newLightness = bgHsl.l > 50 ? newLightness - 10 : newLightness + 10;
      newLightness = Math.max(0, Math.min(100, newLightness));
      const adjustedRgb = hslToRgb(newHue, newSaturation, newLightness);
      contrast = getContrastRatio(bgRgb, adjustedRgb);
      if (newLightness === 0 || newLightness === 100) break;
    }
    const finalRgb = hslToRgb(newHue, newSaturation, newLightness);
    return `#${finalRgb.r.toString(16).padStart(2, "0")}${finalRgb.g
      .toString(16)
      .padStart(2, "0")}${finalRgb.b
      .toString(16)
      .padStart(2, "0")}`.toUpperCase();
  };

  const getRandomColor = (): string => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const showEventModal = (event?: CalendarEvent) => {
    const defaultStart = moment();
    const defaultEnd = moment().add(30, "minutes");

    if (event) {
      // Tìm master event dựa trên seriesId (nếu có) hoặc id (nếu không lặp lại)
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
          seriesId: originalEvent.seriesId || originalEvent.id,
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

  const handleAddOrUpdateEvent = () => {
    const startDate = new Date(eventDetails.start);
    const endDate = new Date(eventDetails.end);
    const eventId = eventDetails.id || new Date().getTime().toString();
    const seriesId =
      eventDetails.repeat !== "none"
        ? eventDetails.seriesId || `series-${new Date().getTime().toString()}`
        : eventId;

    const newEvent: CalendarEvent = {
      id: eventId,
      seriesId: seriesId,
      title: eventDetails.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      date: startDate.toISOString(),
      description: eventDetails.description,
      color: eventDetails.color,
      allDay: false,
      repeat: eventDetails.repeat,
      userId: userId,
      exceptions: eventDetails.id
        ? events.find((e) => e.id === eventDetails.id)?.exceptions || []
        : [], // Giữ exceptions nếu có
    };

    if (eventDetails.id) {
      // Nếu là sự kiện lặp lại và repeat thay đổi, hỏi người dùng
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
          onOk: () => {
            // update Series, Delete exceptions because repeat changed
            const updatedEvents = events
              .filter((evt) => evt.seriesId !== seriesId || evt.id === eventId) // Xóa các exceptions cũ
              .map((evt) => (evt.id === eventDetails.id ? newEvent : evt));
            dispatch(setEvents(updatedEvents));
            setIsModalVisible(false);
          },
          onCancel: () => {
            // Only update master event, keep exceptions
            const updatedEvents = events.map((evt) =>
              evt.id === eventDetails.id ? newEvent : evt
            );
            dispatch(setEvents(updatedEvents));
            setIsModalVisible(false);
          },
        });
      } else {
        // Update as Normal
        const updatedEvents = events.map((event) =>
          event.id === eventDetails.id ? newEvent : event
        );
        dispatch(setEvents(updatedEvents));
        setIsModalVisible(false);
      }
    } else {
      // Add New Event
      dispatch(setEvents([...events, newEvent]));
      setIsModalVisible(false);
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
    setEventDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEventDrop = (args: EventInteractionArgs<CalendarEvent>) => {
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
        onOk: () => {
          // Find master event to calculate originalStart
          const masterEvent = events.find(
            (evt) => evt.seriesId === seriesId && evt.repeat !== "none"
          );
          if (!masterEvent) return;

          //const masterStart = moment(masterEvent.start);
          const instanceStart = moment(event.start);
          const originalStart = instanceStart.toISOString();

          // create exception
          const newEventId = `${seriesId}-${new Date(start).toISOString()}`;
          const newException: CalendarEvent = {
            ...event,
            id: newEventId,
            seriesId: undefined,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            date: new Date(start).toISOString(),
            repeat: "none",
          };

          // update the original Series to add Exception
          const updatedEvents = events.map((evt) =>
            evt.seriesId === seriesId
              ? {
                  ...evt,
                  exceptions: [
                    ...(evt.exceptions || []),
                    { originalStart: originalStart }, // Original time of  instance changed
                  ],
                }
              : evt
          );

          // Add new exception to list
          dispatch(setEvents([...updatedEvents, newException]));
        },
        onCancel: () => {
          const updatedEvents = events.map((evt) =>
            evt.seriesId === seriesId
              ? {
                  ...evt,
                  start: new Date(start).toISOString(),
                  end: new Date(end).toISOString(),
                  date: new Date(start).toISOString(),
                }
              : evt
          );
          dispatch(setEvents(updatedEvents));
        },
      });
    } else {
      const updatedEvents = events.map((evt) =>
        evt.id === event.id
          ? {
              ...evt,
              start: new Date(start).toISOString(),
              end: new Date(end).toISOString(),
              date: new Date(start).toISOString(),
            }
          : evt
      );
      dispatch(setEvents(updatedEvents));
    }
  };

  const handleEventResize = (args: EventInteractionArgs<CalendarEvent>) => {
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
        onOk: () => {
          const newEventId = `${seriesId}-${new Date(start).toISOString()}`;
          const newException: CalendarEvent = {
            ...event,
            id: newEventId,
            seriesId: seriesId,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            date: new Date(start).toISOString(),
            repeat: "none",
          };
          dispatch(setEvents([...events, newException]));
        },
        onCancel: () => {
          const updatedEvents = events.map((evt) =>
            evt.seriesId === seriesId
              ? {
                  ...evt,
                  start: new Date(start).toISOString(),
                  end: new Date(end).toISOString(),
                  date: new Date(start).toISOString(),
                }
              : evt
          );
          dispatch(setEvents(updatedEvents));
        },
      });
    } else {
      const updatedEvents = events.map((evt) =>
        evt.id === event.id
          ? {
              ...evt,
              start: new Date(start).toISOString(),
              end: new Date(end).toISOString(),
              date: new Date(start).toISOString(),
            }
          : evt
      );
      dispatch(setEvents(updatedEvents));
    }
  };

  const eventStyleGetter = (
    event: CalendarEvent
  ): { style: React.CSSProperties } => {
    const backgroundColor = event.color || COLORS[0];
    return {
      style: {
        backgroundColor: backgroundColor,
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content
        style={{
          padding: "0 50px",
          marginTop: "16px",
          minHeight: "85vh",
        }}
      >
        <div
          style={{
            padding: "24px",
            background: "#fff",
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
              if (inputRef.current) {
                inputRef.current.blur();
              }
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

