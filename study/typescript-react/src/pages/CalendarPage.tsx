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

  // Helper function to convert hex color to RGB
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

  // Function to generate a random color
  const getRandomColor = (): string => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Helper function to invert a color
  const invertColor = (color: string): string => {
    const rgb = hexToRgb(color);
    const invertedColor = `#${(255 - rgb.r).toString(16).padStart(2, "0")}${(
      255 - rgb.g
    )
      .toString(16)
      .padStart(2, "0")}${(255 - rgb.b).toString(16).padStart(2, "0")}`;
    return invertedColor.toUpperCase();
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
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: "5px",
        color: invertColor(event.color),
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

