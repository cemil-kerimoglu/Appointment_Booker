import React, { useState } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import AppointmentForm from "./AppointmentForm";
import AppointmentList from "./AppointmentList";

const MainPage = () => {
  const handleLogout = () => {
    Meteor.logout();
  };

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleSave = () => {
    setSelectedAppointment(null);
  };

  const handleCancel = () => {
    setSelectedAppointment(null);
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const user = useTracker(() => Meteor.user());

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {user ? (
            <>
              Welcome,{" "}
              <span className="text-blue-500 font-semibold">
                {user.username}
              </span>
            </>
          ) : (
            "Appointment Booking App"
          )}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
        >
          Logout
        </button>
      </header>
      <main className="flex-grow p-4 flex flex-col lg:flex-row">
        {/* Widget A */}
        <div className="lg:w-1/2 p-2">
          <AppointmentForm
            selectedAppointment={selectedAppointment}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
        {/* Widget B */}
        <div className="lg:w-1/2 p-2">
          <AppointmentList onEdit={handleEdit} />
        </div>
      </main>
    </div>
  );
};

export default MainPage;
