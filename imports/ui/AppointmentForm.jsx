import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { AppointmentsCollection } from "../api/appointments";

const AppointmentForm = ({ selectedAppointment, onSave, onCancel }) => {
  const [date, setDate] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [conflictError, setConflictError] = useState("");

  useEffect(() => {
    if (selectedAppointment) {
      setDate(selectedAppointment.date);
      setFirstName(selectedAppointment.firstName);
      setLastName(selectedAppointment.lastName);
      setAllDay(selectedAppointment.allDay || false);
      setIsEditing(true);
    } else {
      setDate("");
      setFirstName("");
      setLastName("");
      setAllDay(false);
      setIsEditing(false);
    }
  }, [selectedAppointment]);

  const appointmentsOnDate = useTracker(() => {
    if (date) {
      return AppointmentsCollection.find(
        {
          date,
          _id: { $ne: selectedAppointment?._id || null },
        },
        { fields: { allDay: 1 } }
      ).fetch();
    }
    return [];
  }, [date, selectedAppointment]);

  useEffect(() => {
    checkForConflicts();
  }, [date, allDay, appointmentsOnDate]);

  const checkForConflicts = () => {
    setConflictError("");
    if (!date) return;

    const hasAllDayAppointment = appointmentsOnDate.some((appt) => appt.allDay);
    const hasOtherAppointments = appointmentsOnDate.length > 0;

    if (allDay && hasOtherAppointments) {
      setConflictError("There is already another appointment that day.");
    } else if (!allDay && hasAllDayAppointment) {
      setConflictError("There is already an all-day appointment that day.");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!date) {
      newErrors.date = "Date is required.";
    } else if (date < new Date().toISOString().substring(0, 10)) {
      newErrors.date = "Date cannot be in the past.";
    }

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const appointmentData = {
      date,
      firstName,
      lastName,
      allDay,
    };

    if (isEditing && selectedAppointment && selectedAppointment._id) {
      Meteor.call(
        "appointments.update",
        selectedAppointment._id,
        appointmentData,
        (err) => {
          if (err) {
            alert(`Error: ${err.reason}`);
          } else {
            onSave();
            clearForm();
          }
        }
      );
    } else {
      Meteor.call("appointments.insert", appointmentData, (err) => {
        if (err) {
          alert(`Error: ${err.reason}`);
        } else {
          onSave();
          clearForm();
        }
      });
    }
  };

  const clearForm = () => {
    setDate("");
    setFirstName("");
    setLastName("");
    setAllDay(false);
    setIsEditing(false);
    setErrors({});
    setConflictError("");
  };

  const handleCancel = () => {
    clearForm();
    onCancel();
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">
        {isEditing ? "Edit Appointment" : "Create Appointment"}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Date Input */}
        <div className="mb-4">
          <label htmlFor="appointment-date" className="block text-gray-700">
            Date:
          </label>
          <input
            id="appointment-date"
            type="date"
            className={`w-full px-3 py-2 border rounded ${
              errors.date ? "border-red-500" : ""
            }`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            // required
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        {/* All-Day Checkbox */}
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            <span className="ml-2 text-gray-700">All-Day</span>
          </label>
        </div>

        {/* Conflict Warning */}
        {conflictError && (
          <p className="text-red-500 text-sm mb-4">{conflictError}</p>
        )}

        {/* First Name Input */}
        <div className="mb-4">
          <label htmlFor="first-name" className="block text-gray-700">
            First Name:
          </label>
          <input
            id="first-name"
            type="text"
            className={`w-full px-3 py-2 border rounded ${
              errors.firstName ? "border-red-500" : ""
            }`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            // required
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name Input */}
        <div className="mb-6">
          <label htmlFor="last-name" className="block text-gray-700">
            Last Name:
          </label>
          <input
            id="last-name"
            type="text"
            className={`w-full px-3 py-2 border rounded ${
              errors.lastName ? "border-red-500" : ""
            }`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            // required
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* Save and Cancel Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 ${
              conflictError ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={conflictError ? true : false}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
