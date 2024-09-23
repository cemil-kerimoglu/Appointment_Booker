import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../Login";
import { Meteor } from "meteor/meteor";

describe("Login Component", () => {
  const setup = () => {
    render(<Login />);
    const usernameInput = screen.getByLabelText(/Username:/i);
    const passwordInput = screen.getByLabelText(/Password:/i);
    const submitButton = screen.getByRole("button", { name: /Login/i });
    return {
      usernameInput,
      passwordInput,
      submitButton,
    };
  };

  beforeEach(() => {
    Meteor.loginWithPassword.mockClear();
  });

  test("renders the login form correctly", () => {
    const { usernameInput, passwordInput, submitButton } = setup();

    const heading = screen.getByRole("heading", { name: /login/i });
    expect(heading).toBeInTheDocument();

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    expect(usernameInput).toHaveAttribute("type", "text");
    expect(passwordInput).toHaveAttribute("type", "password");

    expect(submitButton).toHaveAttribute("type", "submit");
  });

  test("updates username and password inputs on user typing", () => {
    const { usernameInput, passwordInput } = setup();

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    expect(usernameInput).toHaveValue("testuser");

    fireEvent.change(passwordInput, { target: { value: "password" } });
    expect(passwordInput).toHaveValue("password");
  });

  test("submits the form with correct credentials", () => {
    const { usernameInput, passwordInput, submitButton } = setup();

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });

    fireEvent.click(submitButton);

    expect(Meteor.loginWithPassword).toHaveBeenCalledTimes(1);
    expect(Meteor.loginWithPassword).toHaveBeenCalledWith(
      "testuser",
      "password",
      expect.any(Function)
    );
  });

  test("does not display error message on successful login", async () => {
    const { usernameInput, passwordInput, submitButton } = setup();

    // Mock Meteor.loginWithPassword to call the callback without error
    Meteor.loginWithPassword.mockImplementation(
      (username, password, callback) => {
        callback(null); // Simulate successful login
      }
    );

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });

    fireEvent.click(submitButton);

    // Wait for potential state updates
    await waitFor(() => {
      expect(
        screen.queryByText(/Invalid username or password./i)
      ).not.toBeInTheDocument();
    });
  });

  test("displays error message on failed login", async () => {
    const { usernameInput, passwordInput, submitButton } = setup();

    // Mock Meteor.loginWithPassword to call the callback with an error
    Meteor.loginWithPassword.mockImplementation(
      (username, password, callback) => {
        callback(new Error("Invalid credentials"));
      }
    );

    // Fill in the form with wrong credentials
    fireEvent.change(usernameInput, { target: { value: "wronguser" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText(
      /Invalid username or password./i
    );
    expect(errorMessage).toBeInTheDocument();
  });

  test("clears error message when attempting another login after failure", async () => {
    const { usernameInput, passwordInput, submitButton } = setup();

    // First, mock a failed login
    Meteor.loginWithPassword.mockImplementationOnce(
      (username, password, callback) => {
        callback(new Error("Invalid credentials"));
      }
    );

    // Fill in the form with wrong credentials
    fireEvent.change(usernameInput, { target: { value: "wronguser" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText(
      /Invalid username or password./i
    );
    expect(errorMessage).toBeInTheDocument();

    // Now, mock a successful login
    Meteor.loginWithPassword.mockImplementationOnce(
      (username, password, callback) => {
        callback(null); // Simulate successful login
      }
    );

    // Fill in the form with correct credentials
    fireEvent.change(usernameInput, { target: { value: "correctuser" } });
    fireEvent.change(passwordInput, { target: { value: "correctpassword" } });

    // Submit the form again
    fireEvent.click(submitButton);

    // Wait for the error message to disappear
    await waitFor(() => {
      expect(
        screen.queryByText(/Invalid username or password./i)
      ).not.toBeInTheDocument();
    });
  });

  test("does not submit the form if username is empty", () => {
    const { passwordInput, submitButton } = setup();

    // Fill in only the password
    fireEvent.change(passwordInput, { target: { value: "password" } });

    // Attempt to submit the form
    fireEvent.click(submitButton);

    // Expect Meteor.loginWithPassword not to have been called
    expect(Meteor.loginWithPassword).not.toHaveBeenCalled();
  });

  test("does not submit the form if password is empty", () => {
    const { usernameInput, submitButton } = setup();

    // Fill in only the username
    fireEvent.change(usernameInput, { target: { value: "testuser" } });

    // Attempt to submit the form
    fireEvent.click(submitButton);

    // Expect Meteor.loginWithPassword not to have been called
    expect(Meteor.loginWithPassword).not.toHaveBeenCalled();
  });
});
