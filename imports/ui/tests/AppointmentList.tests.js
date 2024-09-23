import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import AppointmentList from "../AppointmentList";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";

describe("Appointment List", () => {
  const onEdit = jest.fn();

  beforeEach(() => {
    onEdit.mockClear();
    Meteor.call.mockClear();
    useTracker.mockClear();
    useSubscribe.mockClear();
  });

  const appointmentsMock = [
    {
      _id: "1",
      date: "2024-10-10",
      firstName: "John",
      lastName: "Doe",
      allDay: false,
    },
    {
      _id: "2",
      date: "2024-10-11",
      firstName: "Jane",
      lastName: "Smith",
      allDay: true,
    },
  ];

  const renderComponent = (
    trackerData = appointmentsMock,
    isLoading = false
  ) => {
    useSubscribe.mockReturnValue(!isLoading);
    useTracker.mockReturnValue(trackerData);

    render(<AppointmentList onEdit={onEdit} />);
  };

  test("renders the appointments list", () => {
    renderComponent();
    expect(screen.getByText(/Your Appointments/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();
  });

  test("displays loading state when data is loading", () => {
    renderComponent([], true);
    expect(screen.getByText(/Loading appointments/i)).toBeInTheDocument();
  });

  test("displays no appointments message when no appointments exist", () => {
    renderComponent([]);
    expect(screen.getByText(/No appointments found/i)).toBeInTheDocument();
  });

  test("displays list of appointments when appointments exist", () => {
    renderComponent();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Smith")).toBeInTheDocument();
    expect(screen.getByText("10.10.2024")).toBeInTheDocument();
    expect(screen.getByText("11.10.2024")).toBeInTheDocument();
  });

  test("search filters the appointments by name", async () => {
    useSubscribe.mockReturnValue(true);
    useTracker.mockReturnValueOnce(appointmentsMock);
    useTracker.mockReturnValueOnce([appointmentsMock[1]]);

    render(<AppointmentList onEdit={onEdit} />);

    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by name/i);

    fireEvent.change(searchInput, { target: { value: "Jane" } });

    await waitFor(() => {
      expect(screen.queryByText("John")).not.toBeInTheDocument();
      expect(screen.getByText("Jane")).toBeInTheDocument();
    });
  });

  test("initiates editing the appointment when Edit button is clicked", () => {
    renderComponent();

    const editButton = screen.getAllByText(/Edit/i)[0];
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(appointmentsMock[0]);
  });

  test("opens delete confirmation modal when Delete button in the table is clicked", async () => {
    renderComponent();

    const deleteButton = screen.getAllByText(/Delete/i)[0];
    fireEvent.click(deleteButton);

    await waitFor(() => screen.getByText(/Confirm Deletion/i));
    expect(
      screen.getByText(/Are you sure you want to delete/i)
    ).toBeInTheDocument();
  });

  test("successfully deletes appointment when Delete button in the delete confirmation modal is clicked", async () => {
    renderComponent();

    // Find and click the first "Delete" button in the table row
    const deleteButton = screen.getAllByRole("button", { name: /Delete/i })[0];
    fireEvent.click(deleteButton);

    // Wait for the modal to open with the confirmation message
    await waitFor(() => screen.getByText(/Confirm Deletion/i));

    // Find the modal by its role or the confirmation message
    const modal = screen.getByText(/Confirm Deletion/i).closest("div");

    // Now, find the "Delete" button inside the modal using the modal container
    const confirmDeleteButton = within(modal).getByRole("button", {
      name: /Delete/i,
    });

    // Click the "Delete" button inside the modal
    fireEvent.click(confirmDeleteButton);

    await waitFor(() =>
      expect(Meteor.call).toHaveBeenCalledWith(
        "appointments.remove",
        "1",
        expect.any(Function)
      )
    );
  });

  test("closes delete confirmation modal when Cancel button is clicked", async () => {
    renderComponent();

    const deleteButton = screen.getAllByText(/Delete/i)[0];
    fireEvent.click(deleteButton);

    await waitFor(() => screen.getByText(/Confirm Deletion/i));

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    await waitFor(() =>
      expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument()
    );
  });

  test("formats date correctly in the appointment list", () => {
    renderComponent();

    expect(screen.getByText("10.10.2024")).toBeInTheDocument();
    expect(screen.getByText("11.10.2024")).toBeInTheDocument();
  });

  test("displays 'Yes' for all-day appointments and 'No' for non-all-day appointments", () => {
    renderComponent();

    expect(screen.getAllByText("Yes")).toHaveLength(1);
    expect(screen.getAllByText("No")).toHaveLength(1);
  });
});
