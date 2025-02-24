import React, { useState, useEffect, useCallback } from "react";
import { Layout, Button, Modal, Form, Input, Tooltip } from "antd";
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

// Typed wrapper for BigCalendar
const TypedCalendar: React.FC<CalendarProps<CalendarEvent, object>> = (
  props
) => <BigCalendar {...props} />;
const Calendar = withDragAndDrop<CalendarEvent>(TypedCalendar);

const { Content } = Layout;

// Define RootState for Redux
interface RootState {
  user: {
    events: CalendarEvent[];
    isEventsInvalidated: boolean;
  };
}

const CalendarPage: React.FC = () => {
  const localizer = momentLocalizer(moment);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    id: "",
    title: "",
    start: "",
    end: "",
    description: "",
    color: COLORS[0],
  });

  const { events = [] } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Initialize events if needed
  const initializeEvents = useCallback(() => {
    if (events.length === 0) {
      dispatch(setEvents([]));
    }
  }, [dispatch, events.length]);

  useEffect(() => {
    initializeEvents();
  }, [initializeEvents]);

  // Handle deleting an event
  const handleDeleteEvent = () => {
    const updatedEvents = events.filter(
      (event) => event.id !== eventDetails.id
    );
    dispatch(setEvents(updatedEvents));
    setIsModalVisible(false);
  };

  // Helper function to convert hex to RGB (unchanged)
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

  // Helper function to calculate luminance (unchanged)
  const getLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };

  // Helper function to calculate contrast ratio (unchanged)
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

  // Helper function to convert RGB to HSL (unchanged)
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

  // Helper function to convert HSL to RGB (unchanged)
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

  // Enhanced invert color function for better contrast and variety
  const invertColorWithContrast = (
    backgroundColor: string,
    minContrast = 7
  ): string => {
    const bgRgb = hexToRgb(backgroundColor);
    const bgHsl = rgbToHsl(bgRgb.r, bgRgb.g, bgRgb.b);

    // Start with an inverted hue (shift by 180° for contrast)
    const newHue = (bgHsl.h + 180) % 360;
    const newSaturation = Math.min(100, bgHsl.s + 30); // Increase saturation for vibrancy
    let newLightness = bgHsl.l;

    // Generate initial text color and check contrast
    const initialTextRgb = hslToRgb(newHue, newSaturation, newLightness);
    let contrast = getContrastRatio(bgRgb, initialTextRgb);

    // Adjust lightness to achieve minimum contrast
    while (contrast < minContrast) {
      // If contrast is too low, adjust lightness toward the opposite extreme
      newLightness = bgHsl.l > 50 ? newLightness - 10 : newLightness + 10;
      newLightness = Math.max(0, Math.min(100, newLightness)); // Clamp between 0 and 100

      const adjustedRgb = hslToRgb(newHue, newSaturation, newLightness);
      contrast = getContrastRatio(bgRgb, adjustedRgb);

      // Break if contrast is sufficient or we've reached a limit
      if (newLightness === 0 || newLightness === 100) break;
    }

    // Generate final RGB and convert to hex
    const finalRgb = hslToRgb(newHue, newSaturation, newLightness);
    const finalColor = `#${finalRgb.r.toString(16).padStart(2, "0")}${finalRgb.g
      .toString(16)
      .padStart(2, "0")}${finalRgb.b
      .toString(16)
      .padStart(2, "0")}`.toUpperCase();

    return finalColor;
  };

  // Function to generate a random color (unchanged)
  const getRandomColor = (): string => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Show event modal with default start and end times
  const showEventModal = (event?: CalendarEvent) => {
    const defaultStart = moment();
    const defaultEnd = moment().add(30, "minutes");

    if (event) {
      const startTime = moment(event.start);
      const endTime = moment(event.end);

      if (endTime.isBefore(startTime)) {
        const adjustedEnd = startTime.clone().add(30, "minutes");
        setEventDetails({
          id: event.id,
          title: event.title,
          start: startTime.format("YYYY-MM-DDTHH:mm"),
          end: adjustedEnd.format("YYYY-MM-DDTHH:mm"),
          description: event.description || "",
          color: event.color || COLORS[0],
        });
      } else {
        setEventDetails({
          id: event.id,
          title: event.title,
          start: startTime.format("YYYY-MM-DDTHH:mm"),
          end: endTime.format("YYYY-MM-DDTHH:mm"),
          description: event.description || "",
          color: event.color || COLORS[0],
        });
      }
    } else {
      setEventDetails({
        id: "",
        title: "",
        start: defaultStart.format("YYYY-MM-DDTHH:mm"),
        end: defaultEnd.format("YYYY-MM-DDTHH:mm"),
        description: "",
        color: getRandomColor(),
      });
    }

    setIsModalVisible(true);
  };

  // Handle adding or updating the event
  const handleAddOrUpdateEvent = () => {
    const startDate = new Date(eventDetails.start);
    const endDate = new Date(eventDetails.end);
    const newEvent: CalendarEvent = {
      id: eventDetails.id || new Date().getTime().toString(),
      title: eventDetails.title,
      start: startDate,
      end: endDate,
      date: startDate,
      description: eventDetails.description,
      color: eventDetails.color,
      allDay: false, // Explicitly set optional properties if needed
    };

    if (eventDetails.id) {
      const updatedEvents = events.map((event) =>
        event.id === eventDetails.id ? newEvent : event
      );
      dispatch(setEvents(updatedEvents));
    } else {
      dispatch(setEvents([...events, newEvent]));
    }

    setEventDetails({
      id: "",
      title: "",
      start: "",
      end: "",
      description: "",
      color: COLORS[0],
    });
    setIsModalVisible(false);
  };

  // Handle input changes in the form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle event drop (drag-and-drop) functionality
  const handleEventDrop = (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;
    const updatedEvents = events.map((evt) =>
      evt.id === event.id ? { ...evt, start, end, date: start } : evt
    );
    dispatch(
      setEvents(
        updatedEvents.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          date: new Date(event.date),
        }))
      )
    );
  };

  // Handle event resize functionality
  const handleEventResize = (args: EventInteractionArgs<CalendarEvent>) => {
    const { event, start, end } = args;
    const updatedEvents = events.map((evt) =>
      evt.id === event.id ? { ...evt, start, end, date: start } : evt
    );
    dispatch(
      setEvents(
        updatedEvents.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
          date: new Date(event.date),
        }))
      )
    );
  };

  // Customize event styles using eventPropGetter
  const eventStyleGetter = (
    event: CalendarEvent
  ): { style: React.CSSProperties } => {
    const backgroundColor = event.color;
    return {
      style: {
        backgroundColor: backgroundColor,
        borderRadius: "5px",
        color: invertColorWithContrast(backgroundColor), // Use enhanced contrast-aware inversion
        border: "none",
      },
    };
  };

  // Add a Tooltip directly inside the event rendering
  const eventContent = ({ event }: { event: CalendarEvent }) => {
    return (
      <Tooltip
        title={
          <>
            <span
              style={{ color: COLORS[0], fontWeight: "bold", fontSize: "16px" }}
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
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650 }}
            draggableAccessor={() => true}
            resizableAccessor={() => true}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onDoubleClickEvent={(event) => showEventModal(event)}
            eventPropGetter={eventStyleGetter}
            components={{
              event: eventContent,
            }}
            tooltipAccessor={null}
          />

          <Modal
            title={eventDetails.id ? "Edit Event" : "Add Event"}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            onOk={handleAddOrUpdateEvent}
            footer={[
              eventDetails.id && (
                <Button
                  key="delete"
                  danger
                  onClick={handleDeleteEvent}
                  style={{ marginRight: 8 }}
                >
                  Delete
                </Button>
              ),
              <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleAddOrUpdateEvent}
              >
                {eventDetails.id ? "Update Event" : "Add Event"}
              </Button>,
            ]}
          >
            <Form layout="vertical">
              <Form.Item label="Event Title">
                <Input
                  name="title"
                  value={eventDetails.title}
                  onChange={handleInputChange}
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
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
};

export default CalendarPage;

