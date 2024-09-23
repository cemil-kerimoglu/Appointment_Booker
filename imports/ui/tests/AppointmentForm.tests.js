import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppointmentForm from "../AppointmentForm";
import { useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";

describe("Appointment Form", () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    onSave.mockClear();
    onCancel.mockClear();
    Meteor.call.mockClear();
    useTracker.mockClear();
  });

  const renderComponent = (selectedAppointment = null, trackerData = []) => {
    useTracker.mockImplementation(() => trackerData);

    render(
      <AppointmentForm
        selectedAppointment={selectedAppointment}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  };

  test("renders the form with initial state", () => {
    renderComponent();

    expect(screen.getByLabelText(/Date:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name:/i)).toBeInTheDocument();
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });

  test("disables Save button when trying to book an all-day appointment on a date with other existing appointment(s)", async () => {
    // Simulate existing regular appointment on selected date
    const selectedDate = "2024-12-12";
    renderComponent(null, [{ allDay: false }]);

    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: selectedDate },
    });

    fireEvent.click(screen.getByLabelText(/All-Day/i));

    await waitFor(() => {
      expect(
        screen.getByText(/There is already another appointment that day/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Save/i)).toBeDisabled();
  });

  test("disables Save button when trying to book a regular appointment on a date with an existing all-day appointment", async () => {
    // Simulate existing all-day appointment on selected date
    const selectedDate = "2024-12-12";
    renderComponent(null, [{ allDay: true }]);

    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: selectedDate },
    });

    // Ensure 'All-Day' is unchecked to trigger the conflict
    const allDayCheckbox = screen.getByLabelText(/All-Day/i);
    expect(allDayCheckbox).not.toBeChecked();

    // The conflict should detect an existing all-day appointment
    await waitFor(() => {
      expect(
        screen.getByText(/There is already an all-day appointment that day/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Save/i)).toBeDisabled();
  });

  test("shows validation errors when required fields are empty", async () => {
    renderComponent();

    fireEvent.click(screen.getByText(/Save/i));

    expect(await screen.findByText(/Date is required./i)).toBeInTheDocument();
    expect(
      await screen.findByText(/First name is required./i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Last name is required./i)
    ).toBeInTheDocument();

    expect(Meteor.call).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  test("shows validation error when date is in the past", async () => {
    renderComponent();

    const pastDate = "2024-08-08"; // Date is in the past

    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: pastDate },
    });
    fireEvent.change(screen.getByLabelText(/First Name:/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name:/i), {
      target: { value: "Doe" },
    });

    fireEvent.click(screen.getByText(/Save/i));

    expect(
      await screen.findByText(/Date cannot be in the past./i)
    ).toBeInTheDocument();

    expect(Meteor.call).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  test("successfully creates a new appointment", async () => {
    renderComponent([], []);

    const futureDate = "2024-12-12";

    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: futureDate },
    });
    fireEvent.change(screen.getByLabelText(/First Name:/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name:/i), {
      target: { value: "Smith" },
    });

    // Mock successful insert
    Meteor.call.mockImplementation((method, data, callback) => {
      callback(null);
    });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(Meteor.call).toHaveBeenCalledWith(
        "appointments.insert",
        {
          date: futureDate,
          firstName: "Alice",
          lastName: "Smith",
          allDay: false,
        },
        expect.any(Function)
      );
    });

    expect(onSave).toHaveBeenCalled();
    // Ensure form is cleared
    expect(screen.getByLabelText(/Date:/i)).toHaveValue("");
    expect(screen.getByLabelText(/First Name:/i)).toHaveValue("");
    expect(screen.getByLabelText(/Last Name:/i)).toHaveValue("");
    expect(screen.getByLabelText(/All-Day/i)).not.toBeChecked();
  });

  test("successfully updates an appointment", async () => {
    const selectedAppointment = {
      _id: "123",
      date: "2024-10-25",
      firstName: "Robert",
      lastName: "Brown",
      allDay: false,
    };

    renderComponent(selectedAppointment, []);

    // Check that form is pre-filled
    expect(screen.getByLabelText(/Date:/i)).toHaveValue(
      selectedAppointment.date
    );
    expect(screen.getByLabelText(/First Name:/i)).toHaveValue(
      selectedAppointment.firstName
    );
    expect(screen.getByLabelText(/Last Name:/i)).toHaveValue(
      selectedAppointment.lastName
    );
    expect(screen.getByLabelText(/All-Day/i)).not.toBeChecked();

    // Change some fields
    const newDate = "2024-10-26";
    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: newDate },
    });
    fireEvent.click(screen.getByLabelText(/All-Day/i));

    // Mock successful update
    Meteor.call.mockImplementation((method, id, data, callback) => {
      callback(null);
    });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(Meteor.call).toHaveBeenCalledWith(
        "appointments.update",
        "123",
        {
          date: newDate,
          firstName: "Robert",
          lastName: "Brown",
          allDay: true,
        },
        expect.any(Function)
      );
    });

    expect(onSave).toHaveBeenCalled();
    // Ensure form is cleared
    expect(screen.getByLabelText(/Date:/i)).toHaveValue("");
    expect(screen.getByLabelText(/First Name:/i)).toHaveValue("");
    expect(screen.getByLabelText(/Last Name:/i)).toHaveValue("");
    expect(screen.getByLabelText(/All-Day/i)).not.toBeChecked();
  });

  test("sucessfully clears the form when Cancel button is clicked", () => {
    renderComponent();

    // Fill out some fields
    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: "2024-10-12" },
    });
    fireEvent.change(screen.getByLabelText(/First Name:/i), {
      target: { value: "John" },
    });

    // Click Cancel
    fireEvent.click(screen.getByText(/Cancel/i));

    expect(onCancel).toHaveBeenCalled();

    // Ensure form is cleared
    expect(screen.getByLabelText(/Date:/i)).toHaveValue("");
    expect(screen.getByLabelText(/First Name:/i)).toHaveValue("");
    expect(screen.getByLabelText(/Last Name:/i)).toHaveValue("");
    expect(screen.getByLabelText(/All-Day/i)).not.toBeChecked();
  });

  test("does not allow submission when Save is disabled due to conflict", async () => {
    // Simulate existing all-day appointment on selected date
    const selectedDate = "2024-10-12";
    renderComponent(null, [{ allDay: true }]);

    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: selectedDate },
    });

    // Ensure 'All-Day' is checked to cause conflict
    fireEvent.click(screen.getByLabelText(/All-Day/i));

    await waitFor(() => {
      expect(
        screen.getByText(/There is already another appointment that day./i)
      ).toBeInTheDocument();
    });

    // Try to submit the form
    fireEvent.click(screen.getByText(/Save/i));

    expect(Meteor.call).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  test("allows submission when there are no conflicts", async () => {
    // No existing appointments
    renderComponent(null, []);

    const futureDate = "2024-10-12";

    fireEvent.change(screen.getByLabelText(/Date:/i), {
      target: { value: futureDate },
    });
    fireEvent.change(screen.getByLabelText(/First Name:/i), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name:/i), {
      target: { value: "Doe" },
    });

    // Mock successful insert
    Meteor.call.mockImplementation((method, data, callback) => {
      callback(null);
    });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(Meteor.call).toHaveBeenCalledWith(
        "appointments.insert",
        {
          date: futureDate,
          firstName: "Jane",
          lastName: "Doe",
          allDay: false,
        },
        expect.any(Function)
      );
    });

    expect(onSave).toHaveBeenCalled();
  });

  test("pre-fills form when editing an existing appointment", () => {
    const selectedAppointment = {
      _id: "456",
      date: "2024-10-20",
      firstName: "Jane",
      lastName: "Adams",
      allDay: true,
    };

    renderComponent(selectedAppointment, []);

    expect(screen.getByLabelText(/Date:/i)).toHaveValue(
      selectedAppointment.date
    );
    expect(screen.getByLabelText(/First Name:/i)).toHaveValue(
      selectedAppointment.firstName
    );
    expect(screen.getByLabelText(/Last Name:/i)).toHaveValue(
      selectedAppointment.lastName
    );
    expect(screen.getByLabelText(/All-Day/i)).toBeChecked();
    expect(screen.getByText(/Edit Appointment/i)).toBeInTheDocument();
  });

  test("handles all-day conflict when editing an appointment", async () => {
    const selectedAppointment = {
      _id: "789",
      date: "2024-10-10",
      firstName: "Frank",
      lastName: "Miller",
      allDay: false,
    };

    // Simulate another all-day appointment on the same date
    renderComponent(selectedAppointment, [{ allDay: true, _id: "999" }]);

    // Attempt to set 'allDay' to true, which should cause conflict
    const allDayCheckbox = screen.getByLabelText(/All-Day/i);
    fireEvent.click(allDayCheckbox);

    await waitFor(() => {
      expect(
        screen.getByText(/There is already another appointment that day./i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Save/i)).toBeDisabled();
  });
});
