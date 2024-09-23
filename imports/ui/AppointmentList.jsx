import React, { useState } from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { AppointmentsCollection } from "../api/appointments";
import { Meteor } from "meteor/meteor";

const AppointmentList = ({ onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const isLoading = !useSubscribe("appointments");

  const appointments = useTracker(() => {
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const searchRegex = searchTerm ? `^${escapeRegExp(searchTerm)}` : null;

    const query = searchTerm
      ? {
          $or: [
            { firstName: { $regex: searchRegex, $options: "i" } },
            { lastName: { $regex: searchRegex, $options: "i" } },
          ],
        }
      : {};

    return AppointmentsCollection.find(query, { sort: { date: 1 } }).fetch();
  }, [searchTerm]);

  const handleDelete = (appointment) => {
    setAppointmentToDelete(appointment);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (appointmentToDelete) {
      Meteor.call("appointments.remove", appointmentToDelete._id, (err) => {
        if (err) {
          alert(`Error: ${err.reason}`);
        }
        setIsModalOpen(false);
        setAppointmentToDelete(null);
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAppointmentToDelete(null);
  };

  const handleEdit = (appointment) => {
    onEdit(appointment);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded shadow-md w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow-md w-full h-full">
      <h2 className="text-xl font-bold mb-4">Your Appointments</h2>
      <input
        type="text"
        placeholder="Search by name..."
        className="mb-4 w-full px-3 py-2 border rounded"
        value={searchTerm}
        onChange={handleSearch}
      />
      {isLoading ? (
        <p className="text-gray-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-500">No appointments found.</p>
      ) : (
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Date</th>
              <th className="px-4 py-2 border-b">All-Day</th>
              <th className="px-4 py-2 border-b">First Name</th>
              <th className="px-4 py-2 border-b">Last Name</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment._id} className="hover:bg-gray-100">
                <td className="border-b px-4 py-2">
                  {formatDate(appointment.date)}
                </td>
                <td className="border-b px-4 py-2 text-center">
                  {appointment.allDay ? (
                    <span className="text-green-500 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </td>
                <td className="border-b px-4 py-2">{appointment.firstName}</td>
                <td className="border-b px-4 py-2">{appointment.lastName}</td>
                <td className="border-b px-4 py-2">
                  <button
                    onClick={() => handleEdit(appointment)}
                    className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition duration-200 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(appointment)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete the appointment for{" "}
              <span className="font-medium">
                {appointmentToDelete?.firstName} {appointmentToDelete?.lastName}
              </span>
              ?
            </p>
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="mr-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
