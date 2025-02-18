import React, { useState, useEffect } from "react";
import { Layout, Button, Modal, Form, Input, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { COLORS } from "../utils/constant";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Import necessary libraries for drag and drop
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const { Content } = Layout;

const CalendarPage = () => {
  const localizer = momentLocalizer(moment);
  const [events, setEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    id: "",
    title: "",
    start: "",
    end: "",
    description: "",
    color: COLORS[0], // Default color
  });

  // Handle deleting an event
  const handleDeleteEvent = () => {
    const updatedEvents = events.filter(
      (event) => event.id !== eventDetails.id
    );
    setEvents(updatedEvents);
    setIsModalVisible(false); // Close the modal after deletion
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex) => {
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
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Helper function to invert a color
  const invertColor = (color) => {
    const rgb = hexToRgb(color);

    const invertedColor = `#${(255 - rgb.r).toString(16).padStart(2, "0")}${(
      255 - rgb.g
    )
      .toString(16)
      .padStart(2, "0")}${(255 - rgb.b).toString(16).padStart(2, "0")}`;

    return invertedColor.toUpperCase(); // Return the inverted color in uppercase
  };

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem("events"));
    if (savedEvents) {
      setEvents(savedEvents);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem("events", JSON.stringify(events));
    }
  }, [events]);

  // Show event modal with default start and end times
  const showEventModal = (event = null) => {
    const defaultStart = moment();
    let defaultEnd = moment().add(30, "minutes");

    if (event) {
      const startTime = moment(event.start);
      let endTime = moment(event.end);

      if (endTime.isBefore(startTime)) {
        endTime = startTime.clone().add(30, "minutes");
      }

      setEventDetails({
        id: event.id,
        title: event.title,
        start: startTime.format("YYYY-MM-DDTHH:mm"),
        end: endTime.format("YYYY-MM-DDTHH:mm"),
        description: event.description || "",
        color: event.color || COLORS[0],
      });
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
    const newEvent = {
      ...eventDetails,
      start: new Date(eventDetails.start),
      end: new Date(eventDetails.end),
    };

    if (eventDetails.id) {
      const updatedEvents = events.map((event) =>
        event.id === eventDetails.id ? { ...event, ...newEvent } : event
      );
      setEvents(updatedEvents);
    } else {
      setEvents([...events, { ...newEvent, id: new Date().getTime() }]);
    }

    setEventDetails({
      title: "",
      start: "",
      end: "",
      description: "",
      color: COLORS[0],
    });
    setIsModalVisible(false);
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventDetails({
      ...eventDetails,
      [name]: value,
    });
  };

  // Handle event drop (drag-and-drop) functionality
  const handleEventDrop = ({ event, start, end }) => {
    const updatedEvents = events.map((evt) => {
      if (evt.id === event.id) {
        return { ...evt, start, end };
      }
      return evt;
    });
    setEvents(updatedEvents);
  };

  // Handle event resize functionality
  const handleEventResize = ({ event, start, end }) => {
    const updatedEvents = events.map((evt) => {
      if (evt.id === event.id) {
        return { ...evt, start, end };
      }
      return evt;
    });
    setEvents(updatedEvents);
  };

  // Customize event styles using eventPropGetter
  const eventStyleGetter = (event) => {
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
  const eventContent = (event) => {
    return (
      <Tooltip
        title={
          <>
            <span
              style={{ color: COLORS[0], fontWeight: "bold", fontSize: "16px" }}
            >
              {event.event.title}
            </span>
            <br />
            <span style={{ color: COLORS[7] }}>{event.event.description}</span>
          </>
        }
      >
        <span>{event.event.title}</span>
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
        <div style={{ padding: "24px", background: "#fff", minHeight: "85vh" }}>
          <h2>Event Calendar</h2>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showEventModal()}
            style={{ marginBottom: "20px" }}
          >
            Add Event
          </Button>

          <DndProvider backend={HTML5Backend}>
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
              onDoubleClickEvent={showEventModal}
              eventPropGetter={eventStyleGetter}
              components={{
                event: eventContent,
              }}
            />
          </DndProvider>

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

