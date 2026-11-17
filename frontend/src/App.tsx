import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { MeetingRoom } from "./pages/MeetingRoom";
import { Register } from "./pages/Register";
import { StudentHome } from "./pages/StudentHome";
import { SudokuGame } from "./pages/SudokuGame";
import { TeacherHome } from "./pages/TeacherHome";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/teacher"
            element={
              <RequireAuth role="teacher">
                <TeacherHome />
              </RequireAuth>
            }
          />
          <Route
            path="/student"
            element={
              <RequireAuth role="student">
                <StudentHome />
              </RequireAuth>
            }
          />
          <Route
            path="/meetings/:id/room"
            element={
              <RequireAuth>
                <MeetingRoom />
              </RequireAuth>
            }
          />
          <Route
            path="/sudoku"
            element={
              <RequireAuth role="student">
                <SudokuGame />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
