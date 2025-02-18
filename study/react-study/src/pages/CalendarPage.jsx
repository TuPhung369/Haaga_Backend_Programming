import React, { useState } from "react";
import { Layout, Button, Modal, Form, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Import necessary libraries for drag and drop
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
    color: "#ff6347", // Default color
  });

  // Function to generate a random color
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Show event modal with default start and end times
  const showEventModal = (event = null) => {
    const defaultStart = moment().format("YYYY-MM-DDTHH:mm");
    const defaultEnd = moment().add(30, "minutes").format("YYYY-MM-DDTHH:mm");

    if (event) {
      setEventDetails({
        id: event.id,
        title: event.title,
        start: moment(event.start).format("YYYY-MM-DDTHH:mm"),
        end: moment(event.end).format("YYYY-MM-DDTHH:mm"),
        description: event.description || "",
        color: event.color || "#ff6347", // Use the event's color if provided
      });
    } else {
      setEventDetails({
        id: "",
        title: "",
        start: defaultStart,
        end: defaultEnd,
        description: "",
        color: getRandomColor(), // Assign random color for new events
      });
    }

    setIsModalVisible(true);
  };

  // Handle adding or editing the event
  const handleAddOrUpdateEvent = () => {
    const newEvent = {
      ...eventDetails,
      start: new Date(eventDetails.start),
      end: new Date(eventDetails.end),
    };

    if (eventDetails.id) {
      // If an ID exists, update the event
      const updatedEvents = events.map(event =>
        event.id === eventDetails.id ? { ...event, ...newEvent } : event
      );
      setEvents(updatedEvents);
    } else {
      // Otherwise, add a new event
      setEvents([...events, { ...newEvent, id: new Date().getTime() }]);
    }

    setEventDetails({ title: "", start: "", end: "", description: "", color: "#ff6347" });
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
  const handleEventDrop = (dropEvent) => {
    const updatedEvents = events.map(event => {
      if (event.id === dropEvent.event.id) {
        return { ...event, start: dropEvent.start, end: dropEvent.end };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  // Customize event styles using eventPropGetter
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color, // Use the color property for the event
        borderRadius: "5px",
        color: "white",
        border: "none",
      },
    };
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

          {/* Button to trigger the event modal */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showEventModal()}
            style={{ marginBottom: "20px" }}
          >
            Add Event
          </Button>

          {/* Wrap the Calendar with DndProvider for drag-and-drop */}
          <DndProvider backend={HTML5Backend}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 650 }}
              draggable
              onDrop={handleEventDrop}  // Handle event drop here
              onDoubleClickEvent={showEventModal}  // Show event details for editing on double click
              eventPropGetter={eventStyleGetter}  // Apply styles to events
            />
          </DndProvider>

          {/* Modal for adding or editing events */}
          <Modal
            title={eventDetails.id ? "Edit Event" : "Add Event"}
            visible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            onOk={handleAddOrUpdateEvent}
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
