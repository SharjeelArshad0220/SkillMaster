import api from "./axiosInstance";

/**
 * MOCK: Logs in a user.
 */
export const loginUser = async (email, password) => {
  // REAL CALL:
  // const res = await api.post("/auth/login", { email, password });
  // return res.data;

  // MOCK LOGIC:
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    token: "mock_jwt_token_auth_123",
    user: {
      _id: "usr_001",
      name: "Sharjeel Arshad",
      firstName: "Sharjeel",
      email: email,
    },
    hasRoadmap: false, // Initial state for new users
  };
};

/**
 * MOCK: Registers a new user.
 */
export const signupUser = async (name, email, password) => {
  // REAL CALL:
  // const res = await api.post("/auth/signup", { name, email, password });
  // return res.data;

  // MOCK LOGIC:
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    token: "mock_jwt_token_signup_456",
    user: {
      _id: "usr_002",
      name: name,
      firstName: name.split(" ")[0],
      email: email,
    },
  };
};

/**
 * MOCK: Validates token and gets current user info on refresh.
 */
export const getMe = async () => {
  // REAL CALL:
  // const res = await api.get("/auth/me");
  // return res.data;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const storedUser = localStorage.getItem("sm_user");
  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    hasRoadmap: !!localStorage.getItem("sm_roadmap"),
  };
};
