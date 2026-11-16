import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { registerStudent, registerTeacher } from "../api/auth";
import { ApiError } from "../api/client";
import { listCities, listSchools } from "../api/lookups";
import type { City, School } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { TopBar } from "../components/TopBar";

type RoleTab = "student" | "teacher";

export function Register() {
  const { user, applySession } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<RoleTab>("student");
  const [cities, setCities] = useState<City[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [cityId, setCityId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");

  useEffect(() => {
    void listCities()
      .then((rows) => setCities(rows))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load cities"),
      );
  }, []);

  useEffect(() => {
    if (!cityId || tab !== "student") {
      setSchools([]);
      setSchoolId("");
      return;
    }
    void listSchools(cityId)
      .then((rows) => {
        setSchools(rows);
        setSchoolId("");
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load schools"),
      );
  }, [cityId, tab]);

  if (user) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session =
        tab === "student"
          ? await registerStudent({
              username,
              email,
              password,
              class_name: className,
              date_of_birth: dateOfBirth,
              city_id: cityId,
              school_id: schoolId,
            })
          : await registerTeacher({
              username,
              email,
              password,
              qualification,
              city_id: cityId,
              experience_years: Number(experienceYears),
            });
      applySession(session);
      navigate(session.user.role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-page">
      <TopBar />
      <main className="auth-layout">
        <aside className={`auth-aside ${tab === "teacher" ? "teacher" : ""}`}>
          <div>
            <span className="feature-kicker">
              {tab === "student" ? "Student onboarding" : "Teacher onboarding"}
            </span>
            <h2>
              {tab === "student"
                ? "Join class ready to learn"
                : "Set up your teaching space"}
            </h2>
            <p>
              {tab === "student"
                ? "Add your class, school, and city so meetings and reports stay tied to your profile."
                : "Share your qualification and experience so students know who is hosting the room."}
            </p>
          </div>
          <ul className="auth-aside-points">
            {tab === "student" ? (
              <>
                <li>Class and school profile</li>
                <li>Join live meetings in one tap</li>
                <li>Track learning progress later</li>
              </>
            ) : (
              <>
                <li>Create meetings instantly</li>
                <li>Invite students to join</li>
                <li>Lead the live classroom</li>
              </>
            )}
          </ul>
        </aside>

        <section className="panel-surface">
          <h1>Create your account</h1>
          <p className="lede">Choose a role and fill in the details for Learning Platform.</p>

          <div className="tabs" role="tablist">
            <button
              type="button"
              className={`tab ${tab === "student" ? "active" : ""}`}
              onClick={() => setTab("student")}
            >
              Student
            </button>
            <button
              type="button"
              className={`tab ${tab === "teacher" ? "active" : ""}`}
              onClick={() => setTab("teacher")}
            >
              Teacher
            </button>
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <form className="form-grid" onSubmit={onSubmit}>
            <div className="form-grid two">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={1}
                  maxLength={100}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={72}
              />
            </div>

            {tab === "student" ? (
              <>
                <div className="form-grid two">
                  <div className="field">
                    <label htmlFor="class_name">Class</label>
                    <input
                      id="class_name"
                      value={className}
                      onChange={(event) => setClassName(event.target.value)}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="date_of_birth">Date of birth</label>
                    <input
                      id="date_of_birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-grid two">
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <select
                      id="city"
                      value={cityId}
                      onChange={(event) => setCityId(event.target.value)}
                      required
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="school">School</label>
                    <select
                      id="school"
                      value={schoolId}
                      onChange={(event) => setSchoolId(event.target.value)}
                      required
                      disabled={!cityId}
                    >
                      <option value="">Select a school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="qualification">Qualification</label>
                  <input
                    id="qualification"
                    value={qualification}
                    onChange={(event) => setQualification(event.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="form-grid two">
                  <div className="field">
                    <label htmlFor="teacher_city">City</label>
                    <select
                      id="teacher_city"
                      value={cityId}
                      onChange={(event) => setCityId(event.target.value)}
                      required
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="experience_years">Experience (years)</label>
                    <input
                      id="experience_years"
                      type="number"
                      min={0}
                      value={experienceYears}
                      onChange={(event) => setExperienceYears(event.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button className="btn btn-green btn-block" type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Sign up Free"}
            </button>
          </form>

          <p className="auth-footer">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
