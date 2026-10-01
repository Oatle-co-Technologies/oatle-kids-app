
import { useEffect, useMemo, useState } from "react";
import "./BetaFeedback.css";
import { supabase } from "../lib/supabase";

const FEEDBACK_SCHEDULE = {
  1: {
    adventure: "Reading Adventures",
    title: "Monday — Reading Adventures",
    planets: [
      ["Mercury", "Capital Letters"],
      ["Venus", "Lowercase Letters"],
      ["Earth", "Uppercase & Lowercase Matching"],
      ["Mars", "Listening & Building Words"],
    ],
  },
  2: {
    adventure: "Reading Adventures",
    title: "Tuesday — Reading Adventures",
    planets: [
      ["Jupiter", "Reading Simple Words"],
      ["Saturn", "Missing Letters"],
      ["Uranus", "Building Sentences"],
      ["Neptune", "Reading the Story"],
      ["Pluto", "Reading Skills Assessment"],
    ],
  },
  3: {
    adventure: "Math Adventures",
    title: "Wednesday — Math Adventures",
    planets: [
      ["Mercury", "Number Recognition"],
      ["Venus", "Shape Explorers"],
      ["Earth", "Counting Shapes"],
      ["Mars", "Colour Explorers"],
    ],
  },
  4: {
    adventure: "Math Adventures",
    title: "Thursday — Math Adventures",
    planets: [
      ["Jupiter", "Matching & Sorting"],
      ["Saturn", "Adding Numbers"],
      ["Uranus", "Taking Away"],
      ["Neptune", "Equal Groups & Sharing"],
      ["Pluto", "Maths Assessment"],
    ],
  },
  5: {
    adventure: "Writing Adventures",
    title: "Friday — Writing Adventures",
    planets: [
      ["Mercury", "Alphabet Tracing"],
      ["Venus", "Number Tracing"],
      ["Earth", "Shape Tracing"],
      ["Mars", "Writing Simple Sentences"],
    ],
  },
};

const ACTIVITY_OPTIONS = [
  "Child explored independently",
  "Child needed some guidance",
  "Parent guided the activity throughout",
  "Child had difficulty engaging with the activity",
];

const TEACHING_OPTIONS = ["Yes", "Somewhat", "No", "Not applicable"];

const RESPONSIVENESS_OPTIONS = [
  "Yes, everything responded normally",
  "Sometimes it was slow",
  "Some interactions did not respond",
  "Nothing responded properly",
];

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");

  return {
    date: `${year}-${month}-${dayOfMonth}`,
    day: date.getDay(),
  };
}

function RadioGroup({ name, value, options, onChange }) {
  return (
    <div className="beta-feedback-options">
      {options.map((option) => (
        <label className="beta-feedback-option" key={option}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={(event) => onChange(event.target.value)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function BetaFeedback({ user, onBack }) {
  const today = useMemo(() => getToday(), []);
  const dayConfig = FEEDBACK_SCHEDULE[today.day];
  const isWritingDay = today.day === 5;

  const [answers, setAnswers] = useState({});
  const [technicalDifficulty, setTechnicalDifficulty] = useState("");
  const [technicalDetails, setTechnicalDetails] = useState("");
  const [responsiveness, setResponsiveness] = useState("");
  const [visualIssue, setVisualIssue] = useState("");
  const [visualDetails, setVisualDetails] = useState("");
  const [finalNotice, setFinalNotice] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSubmission() {
      if (!user?.id || !dayConfig) {
        if (mounted) setStatus(dayConfig ? "ready" : "weekend");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("beta_feedback")
        .select("id")
        .eq("user_id", user.id)
        .eq("feedback_date", today.date)
        .maybeSingle();

      if (!mounted) return;

      if (loadError) {
        console.error("Feedback check failed:", loadError);
        setError("We couldn't check today's feedback status.");
        setStatus("ready");
        return;
      }

      setStatus(data ? "submitted" : "ready");
    }

    loadSubmission();

    return () => {
      mounted = false;
    };
  }, [user?.id, today.date, dayConfig]);

  function setPlanetAnswer(planetIndex, field, value) {
    setAnswers((current) => ({
      ...current,
      [planetIndex]: {
        ...current[planetIndex],
        [field]: value,
      },
    }));
  }

  function isComplete() {
    const planetsComplete = dayConfig.planets.every((_, index) => {
      const answer = answers[index];
      return answer?.activity && answer?.teaching;
    });

    if (!planetsComplete) return false;
    if (!technicalDifficulty || !responsiveness || !visualIssue) {
      return false;
    }
    if (technicalDifficulty === "Yes" && !technicalDetails.trim()) {
      return false;
    }
    if (visualIssue === "Yes" && !visualDetails.trim()) {
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isComplete() || saving) return;

    setSaving(true);
    setError("");

    const deviceInfo = {
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen: `${window.innerWidth}x${window.innerHeight}`,
    };

    const payload = {
      user_id: user.id,
      feedback_date: today.date,
      beta_day: dayConfig.title.split(" — ")[0],
      adventure: dayConfig.adventure,
      activities: dayConfig.planets.map(([planet, activity], index) => ({
        planet,
        activity,
        how_it_went: answers[index]?.activity || null,
        helped_teach: answers[index]?.teaching || null,
        confusion: answers[index]?.confusion?.trim() || null,
      })),
      technical: {
        difficulties: technicalDifficulty,
        details:
          technicalDifficulty === "Yes"
            ? technicalDetails.trim()
            : null,
        responsiveness,
        writing_responsiveness: isWritingDay ? responsiveness : null,
        visual_issue: visualIssue,
        visual_details:
          visualIssue === "Yes" ? visualDetails.trim() : null,
        most_important_notice: finalNotice.trim() || null,
      },
      device_info: deviceInfo,
    };

    const { error: submitError } = await supabase
      .from("beta_feedback")
      .insert(payload);

    if (submitError) {
      console.error("Feedback submission failed:", submitError);

      if (submitError.code === "23505") {
        setStatus("submitted");
      } else {
        setError("We couldn't submit your feedback. Please try again.");
      }

      setSaving(false);
      return;
    }

    setStatus("submitted");
    setSaving(false);
  }

  if (status === "loading") {
    return (
      <main className="page beta-feedback-page">
        <p className="eyebrow">PARENT FEEDBACK</p>
        <h1>Today's Feedback</h1>
        <p className="page-intro">Checking today's form...</p>
      </main>
    );
  }

  if (status === "weekend") {
    return (
      <main className="page beta-feedback-page">
        <p className="eyebrow">PARENT FEEDBACK</p>
        <h1>Today's Feedback</h1>
        <p className="page-intro">
          Daily beta feedback is available Monday to Friday.
        </p>
        <button className="secondary-button" onClick={onBack} type="button">
          ← Back to Settings
        </button>
      </main>
    );
  }

  if (status === "submitted") {
    return (
      <main className="page beta-feedback-page">
        <p className="eyebrow">PARENT FEEDBACK</p>
        <h1>Feedback submitted ✓</h1>
        <p className="page-intro">
          Thank you. Today's feedback has been saved.
        </p>
        <button className="primary-button" onClick={onBack} type="button">
          Back to Settings
        </button>
      </main>
    );
  }

  return (
    <main className="page beta-feedback-page">
      <p className="eyebrow">PARENT FEEDBACK</p>
      <h1>Today's Feedback</h1>

      <p className="beta-feedback-day">{dayConfig.title}</p>

      <p className="page-intro beta-feedback-intro">
        This feedback is about your experience using the product with your
        child. You can read instructions, explain concepts, demonstrate
        activities, and guide your child. Independent use is not expected.
      </p>

      <form onSubmit={handleSubmit}>
        {dayConfig.planets.map(([planet, activity], index) => {
          const answer = answers[index] || {};

          return (
            <section className="beta-feedback-section" key={planet}>
              <div className="beta-feedback-section-heading">
                <span className="beta-feedback-planet">{planet}</span>
                <h2>{activity}</h2>
              </div>

              <fieldset>
                <legend>How did the activity go?</legend>
                <RadioGroup
                  name={`activity-${index}`}
                  value={answer.activity}
                  options={ACTIVITY_OPTIONS}
                  onChange={(value) =>
                    setPlanetAnswer(index, "activity", value)
                  }
                />
              </fieldset>

              <fieldset>
                <legend>Did the activity help you teach the concept?</legend>
                <RadioGroup
                  name={`teaching-${index}`}
                  value={answer.teaching}
                  options={TEACHING_OPTIONS}
                  onChange={(value) =>
                    setPlanetAnswer(index, "teaching", value)
                  }
                />
              </fieldset>

              <label className="beta-feedback-field">
                <span>What, if anything, confused you or your child?</span>
                <textarea
                  value={answer.confusion || ""}
                  onChange={(event) =>
                    setPlanetAnswer(index, "confusion", event.target.value)
                  }
                  rows="2"
                  placeholder="Optional"
                />
              </label>
            </section>
          );
        })}

        <section className="beta-feedback-section">
          <div className="beta-feedback-section-heading">
            <span className="beta-feedback-planet">TECHNICAL</span>
            <h2>How did the product respond?</h2>
          </div>

          <fieldset>
            <legend>Did you experience any technical difficulties?</legend>
            <RadioGroup
              name="technical-difficulties"
              value={technicalDifficulty}
              options={["No", "Yes"]}
              onChange={setTechnicalDifficulty}
            />
          </fieldset>

          {technicalDifficulty === "Yes" && (
            <label className="beta-feedback-field">
              <span>What happened?</span>
              <textarea
                value={technicalDetails}
                onChange={(event) => setTechnicalDetails(event.target.value)}
                rows="3"
                placeholder="Tell us briefly what happened."
              />
            </label>
          )}

          <fieldset>
            <legend>
              {isWritingDay
                ? "Did the writing/tracing respond properly to your child's finger or stylus?"
                : "Did the product respond properly when your child interacted with it?"}
            </legend>
            <RadioGroup
              name="responsiveness"
              value={responsiveness}
              options={RESPONSIVENESS_OPTIONS}
              onChange={setResponsiveness}
            />
          </fieldset>

          <fieldset>
            <legend>
              Did anything look incorrect or appear out of place on the screen?
            </legend>
            <RadioGroup
              name="visual-issue"
              value={visualIssue}
              options={["No", "Yes"]}
              onChange={setVisualIssue}
            />
          </fieldset>

          {visualIssue === "Yes" && (
            <label className="beta-feedback-field">
              <span>Please describe it.</span>
              <textarea
                value={visualDetails}
                onChange={(event) => setVisualDetails(event.target.value)}
                rows="3"
                placeholder="Tell us what you saw."
              />
            </label>
          )}

          <label className="beta-feedback-field">
            <span>What is the most important thing you noticed today?</span>
            <textarea
              value={finalNotice}
              onChange={(event) => setFinalNotice(event.target.value)}
              rows="3"
              placeholder="Anything that stood out."
            />
          </label>
        </section>

        {error && (
          <p className="beta-feedback-error" role="alert">
            {error}
          </p>
        )}

        <div className="beta-feedback-actions">
          <button
            className="secondary-button"
            onClick={onBack}
            type="button"
            disabled={saving}
          >
            ← Back
          </button>

          <button
            className="primary-button"
            type="submit"
            disabled={saving || !isComplete()}
          >
            {saving ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default BetaFeedback;
