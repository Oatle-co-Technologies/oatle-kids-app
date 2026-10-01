import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import { questions } from "./data/questions";
import { lowercaseQuestions } from "./data/lowercaseQuestions";
import { matchingQuestions } from "./data/matchingQuestions";
import { wordOrderQuestions } from "./data/wordOrderQuestions";
import { readingQuestions } from "./data/readingQuestions";
import { sentenceQuestions } from "./data/sentenceQuestions";
import { missingLettersQuestions } from "./data/missingLettersQuestions";
import {
  assessmentQuestions as plutoQuestions,
  assessmentSkills as plutoSkills,
} from "./data/assessmentQuestions";
import { speak, stopSpeech } from "./utils/speech";
import LoginPage from "./components/LoginPage";
import { supabase } from "./lib/supabase";

import { generateOptions } from "./utils/generateOptions";
import { generateReadingOptions } from "./utils/generateReadingOptions";
import { generateSentenceOptions } from "./utils/generateSentenceOptions";
import { generateMissingLettersOptions } from "./utils/generateMissingLettersOptions";

import MathSection from "./components/MathSection";
import Scribbler from "./components/Scribbler";
import AlphabetTracingMission from "./components/AlphabetTracingMission";
import NumberTracingMission from "./components/NumberTracingMission";
import ShapeTracingMission from "./components/ShapeTracingMission";
import SentenceWritingMission from "./components/SentenceWritingMission";
import BetaFeedback from "./components/BetaFeedback";
import LocalBackButton from "./components/LocalBackButton";
import LittleExplorers from "./components/LittleExplorers";

import mercuryImage from "./assets/images/planets/mercury.webp";
import venusImage from "./assets/images/planets/venus.webp";
import earthImage from "./assets/images/planets/earth.webp";
import marsImage from "./assets/images/planets/mars.webp";
import jupiterImage from "./assets/images/planets/jupitor.webp";
import saturnImage from "./assets/images/planets/saturn.webp";
import uranusImage from "./assets/images/planets/uranus.webp";
import neptuneImage from "./assets/images/planets/neptune.webp";
import plutoImage from "./assets/images/planets/pluto.webp";

import correctSound from "./sounds/correct.mp3";
import wrongSound from "./sounds/wrong.mp3";
import victorySound from "./sounds/victory.mp3";
import welcomeSound from "./sounds/welcome-sound.mp3";

import neptunePage1 from "./assets/images/story/neptune-page1.webp";
import neptunePage2 from "./assets/images/story/neptune-page2.webp";
import neptunePage3 from "./assets/images/story/neptune-page3.webp";
import neptunePage4 from "./assets/images/story/neptune-page4.webp";
import neptunePage5 from "./assets/images/story/neptune-page5.webp";
import neptunePage6 from "./assets/images/story/neptune-page6.webp";
import neptunePage7 from "./assets/images/story/neptune-page7.webp";
import neptunePage8 from "./assets/images/story/neptune-page8.webp";
import neptunePage9 from "./assets/images/story/neptune-page9.webp";
import neptunePage10 from "./assets/images/story/neptune-page10.webp";
import neptunePage11 from "./assets/images/story/neptune-page11.webp";
import neptunePage12 from "./assets/images/story/neptune-page12.webp";

const neptuneStory = [
  {
    image: neptunePage1,
    text: ["Atli is on Neptune."],
  },
  {
    image: neptunePage2,
    text: ["Atli has a red map."],
  },
  {
    image: neptunePage3,
    text: ["Atli has his bag."],
  },
  {
    image: neptunePage4,
    text: ["Atli lost his map."],
  },
  {
    image: neptunePage5,
    text: ["Atli looks in his bag."],
  },
  {
    image: neptunePage6,
    text: ["Atli looks on the rug."],
  },
  {
    image: neptunePage7,
    text: ["Atli sees a dog."],
  },
  {
    image: neptunePage8,
    text: ["The dog runs to the net."],
  },
  {
    image: neptunePage9,
    text: ["Atli finds his map under the net."],
  },
  {
    image: neptunePage10,
    text: ["Atli can go home."],
  },
  {
    image: neptunePage11,
    text: ["Atli is home with Mom and his brother."],
  },
  {
    image: neptunePage12,
    text: ["The stars will guide you home."],
  },
];

const planets = [
  {
    id: 1,
    name: "Mercury",
    image: mercuryImage,
    color: "#FFBD59",
    description: "Learn capital letters",
    questions,
  },
  {
    id: 2,
    name: "Venus",
    image: venusImage,
    color: "#FF8D70",
    description: "Explore lowercase letters",
    questions: lowercaseQuestions,
  },
  {
    id: 3,
    name: "Earth",
    image: earthImage,
    color: "#55C6FF",
    description: "Match upper and lowercase",
    questions: matchingQuestions,
  },
  {
    id: 4,
    name: "Mars",
    image: marsImage,
    color: "#EF5B5B",
    description:
      "Listen to the word and put it in the right order",
    questions: wordOrderQuestions,
  },
  {
    id: 5,
    name: "Jupiter",
    image: jupiterImage,
    color: "#D6B44C",
    description: "Read simple words",
    questions: readingQuestions,
  },
  {
    id: 6,
    name: "Saturn",
    image: saturnImage,
    color: "#E7C77A",
    description: "Fill in the missing letter",
    questions: missingLettersQuestions,
  },
  {
    id: 7,
    name: "Uranus",
    image: uranusImage,
    color: "#76D8E8",
    description: "Build simple sentences",
    questions: sentenceQuestions,
  },
  {
    id: 8,
    name: "Neptune",
    image: neptuneImage,
    color: "#4C78FF",
    description: "Read Atli and the Lost Map",
    questions: neptuneStory,
  },
  {
    id: 9,
    name: "Pluto",
    image: plutoImage,
    color: "#D9C5A4",
    description: "Complete the final skills assessment",
    questions: "pluto-assessment",
  },
];

const emptyPlutoResults = () =>
  Object.fromEntries(
    plutoSkills.map((skill) => [
      skill.id,
      {
        correct: 0,
        total: 4,
      },
    ])
  );

const savedAssessmentResults = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem("atli-space-assessment-results")
      ) || null
    );
  } catch {
    return null;
  }
};

const READING_ASSESSMENT_ATTEMPT_KEY =
  "oatle-reading-assessment-attempt";

const savedReadingAssessmentAttempt = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(READING_ASSESSMENT_ATTEMPT_KEY)
    );

    return {
      active: Boolean(saved?.active),
      scores: saved?.scores || emptyPlutoResults(),
    };
  } catch {
    return {
      active: false,
      scores: emptyPlutoResults(),
    };
  }
};

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

const BIG_KIDS_PRAISE = [
  "Great job!",
  "Amazing!",
  "Well done!",
  "You got it!",
];

function stopAudioRef(audioRef) {
  if (!audioRef.current) {
    return;
  }

  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current = null;
}

const savedGame = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("atli-space-progress")
    );

    if (!saved) {
      return {
        unlocked: 1,
        activePlanet: 1,
        question: 0,
        missions: {},
        startedMissions: {},
      };
    }

    return {
      unlocked: 1,
      activePlanet: 1,
      question: 0,
      missions: {},
      startedMissions: {},
      ...saved,
    };
  } catch {
    return {
      unlocked: 1,
      activePlanet: 1,
      question: 0,
      missions: {},
      startedMissions: {},
    };
  }
};

const savedWritingProgress = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("atli-writing-progress")
    );

    return {
      unlocked: 1,
      missions: {},
      startedMissions: {},
      ...(saved || {}),
    };
  } catch {
    return {
      unlocked: 1,
      missions: {},
      startedMissions: {},
    };
  }
};

const savedChildProfile = () => {
  try {
    return (
      JSON.parse(
        localStorage.getItem("oatle-child-profile")
      ) || {
        name: "",
        age: "",
        favouriteColour: "",
        siblings: "",
      }
    );
  } catch {
    return {
      name: "",
      age: "",
      favouriteColour: "",
      siblings: "",
    };
  }
};

const savedAgeGroup = () => {
  const saved = localStorage.getItem("oatle-age-group");
  return saved === "little" || saved === "big" ? saved : null;
};

const writingPlanets = [
  {
    id: 1,
    name: "Mercury",
    image: mercuryImage,
    color: "#FFBD59",
    description: "Trace the alphabet",
    mission: "writingMission1",
  },
  {
    id: 2,
    name: "Venus",
    image: venusImage,
    color: "#FF8D70",
    description: "Trace the numbers",
    mission: "writingMission2",
  },
  {
    id: 3,
    name: "Earth",
    image: earthImage,
    color: "#55C6FF",
    description: "Trace the shapes",
    mission: "writingMission3",
  },
  {
    id: 4,
    name: "Mars",
    image: marsImage,
    color: "#EF5B5B",
    description: "Write simple sentences",
    mission: "writingMission4",
  },
];

/*
 * Spoken guidance for reading missions. Questions and instructions
 * are narrated, while assessment answers stay silent until the child
 * has made a choice.
 */
function getSpeechText(planetId, question) {
  if (!question) {
    return null;
  }

  switch (planetId) {
    case 1:
      return question.target
        ? `Find ${question.target}.`
        : null;

    case 2:
      return question.target
        ? `Find ${question.target}.`
        : null;

    case 3:
      if (
        question.target &&
        question.target === question.target.toUpperCase()
      ) {
        return "Match the uppercase letter to its lowercase letter.";
      }

      return "Match the lowercase letter to its uppercase letter.";

    case 4:
      return null;

    case 5:
      return "What is this?";

    case 6:
      return "Find the missing letter.";

    case 7:
      return "Build the sentence.";

    case 8:
      return question.text?.join(" ") || null;

    case 9:
      if (
        question.skill === "reading" ||
        question.type === "reading"
      ) {
        return null;
      }

      switch (question.skill) {
        case "capital":
          return question.target
            ? `Find ${question.target}.`
            : null;

        case "lowercase":
          return question.target
            ? `Find ${question.target}.`
            : null;

        case "matching":
          if (
            question.target &&
            question.target === question.target.toUpperCase()
          ) {
            return "Match the uppercase letter to its lowercase letter.";
          }

          return "Match the lowercase letter to its uppercase letter.";

        case "phonics":
          return null;

        case "missing":
          return "Find the missing letter.";

        case "sentences":
          return "Build the sentence.";

        default:
          return null;
      }

    default:
      return null;
  }
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 10.5 12 3l9 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5.5 9.5V21h13V9.5M9 21v-6h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        transform="rotate(-20 12 12)"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="m19.4 15.2 1.2 1-.2 1.2-1.8 1.8-1.2.2-1-1.2-1.6.7-.2 1.5-1 .8h-2.6l-1-.8-.2-1.5-1.6-.7-1 1.2-1-.2-1.8-1.8-.2-1.2 1.2-1-.7-1.6-1.5-.2-.8-1V9.8l.8-1 1.5-.2.7-1.6-1.2-1 .2-1.2L6 3l1.2-.2 1 1.2 1.6-.7.2-1.5 1-.8h2.6l1 .8.2 1.5 1.6.7 1-1.2L19 3l1.8 1.8.2 1.2-1.2 1 .7 1.6 1.5.2.8 1v2.6l-.8 1-1.5.2-.7 1.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NumberIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="currentColor"
      >
        123
      </text>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 5.5c2.8-.8 5.5-.2 8 1.5v12c-2.5-1.7-5.2-2.3-8-1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M20 5.5c-2.8-.8-5.5-.2-8 1.5v12c2.5-1.7 5.2-2.3 8-1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m15.5 5.5 3 3L8 19H5v-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="m14 7 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LittleExplorerIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        d="M32 8c7 0 12.5 5.5 12.5 12.5 0 5.5-3.5 10.2-8.4 11.9L34 40h-4l-2.1-7.6A12.5 12.5 0 0 1 32 8Z"
        fill="#ffd45c"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M25 43h14v10H25z" fill="#55c6ff" stroke="currentColor" strokeWidth="3" />
      <path d="M20 55h24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="27" cy="19" r="2.5" fill="currentColor" />
      <circle cx="37" cy="19" r="2.5" fill="currentColor" />
      <path d="M27 25c3 3 7 3 10 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m10 15 1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9L6.4 26l.7-4-2.9-2.8 4-.6Z" fill="#ff6f91" />
      <path d="m51 28 1.4 2.8 3.1.5-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.2 3.1-.5Z" fill="#a875e8" />
    </svg>
  );
}

function AppNav({
  onHome,
  onExplore,
  onSettings,
  activeScreen,
}) {
  const items = [
    {
      label: "Home",
      action: onHome,
      icon: <HomeIcon />,
      active: activeScreen === "home",
    },
    {
      label: "Explore",
      action: onExplore,
      icon: <PlanetIcon />,
      active:
        activeScreen === "explore" ||
        activeScreen === "map" ||
        activeScreen === "planet" ||
        activeScreen === "mission" ||
        activeScreen === "launch" ||
        activeScreen === "math" ||
        activeScreen === "writing" ||
        activeScreen === "writingMap" ||
        activeScreen === "writingPlanet" ||
        activeScreen === "writingCelebration" ||
        activeScreen === "scribbler" ||
        activeScreen === "writingMission1" ||
        activeScreen === "writingMission2" ||
        activeScreen === "writingMission3" ||
        activeScreen === "writingMission4" ||
        activeScreen === "littleExplorers",
    },
    {
      label: "Settings",
      action: onSettings,
      icon: <SettingsIcon />,
      active: activeScreen === "settings",
    },
  ];

  return (
    <nav
      className="bottom-nav"
      aria-label="Main navigation"
    >
      {items.map((item) => (
        <button
          key={item.label}
          className={`bottom-nav-item ${
            item.active ? "active" : ""
          }`}
          onClick={item.action}
          type="button"
          aria-label={item.label}
          aria-current={
            item.active ? "page" : undefined
          }
        >
          <span className="bottom-nav-icon">
            {item.icon}
          </span>

          <span className="bottom-nav-label">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

function PlanetVisual({
  planet,
  className = "",
}) {
  return planet.image ? (
    <img
      className={className}
      src={planet.image}
      alt={planet.name}
    />
  ) : (
    <span
      className={className}
      role="img"
      aria-label={planet.name}
    >
      {planet.emoji}
    </span>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication and product access are separate.
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // PayFast test state
  // Deployment trigger check
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const [progress, setProgress] = useState(savedGame);

  const [writingProgress, setWritingProgress] =
    useState(savedWritingProgress);

  const [writingActivePlanet, setWritingActivePlanet] =
    useState(1);

  const [writingCelebrationMission, setWritingCelebrationMission] =
    useState(null);

  const [screen, setScreen] = useState(() =>
    savedAgeGroup() === "little" ? "littleExplorers" : "home"
  );
  const [ageGroup, setAgeGroup] = useState(savedAgeGroup);
  const [launchAdventure, setLaunchAdventure] =
    useState("reading");

  const [assessmentResults, setAssessmentResults] =
    useState(savedAssessmentResults);

  const [assessmentScores, setAssessmentScores] =
    useState(() => savedReadingAssessmentAttempt().scores);

  const [readingAssessmentActive, setReadingAssessmentActive] =
    useState(() => savedReadingAssessmentAttempt().active);

  const [soundOn, setSoundOn] = useState(true);

  const [childProfile, setChildProfile] =
    useState(savedChildProfile);

  const [feedback, setFeedback] = useState("");
  const [builtSentence, setBuiltSentence] =
    useState([]);
  const [builtWord, setBuiltWord] =
    useState([]);
  const [isProcessing, setIsProcessing] =
    useState(false);
  const [revealedAnswer, setRevealedAnswer] =
    useState("");

  const advanceTimer = useRef(null);
  const welcomeAudioRef = useRef(null);
  const victoryAudioRef = useRef(null);
  const effectAudioRef = useRef(null);

  useLayoutEffect(() => {
    // React swaps screens without a browser navigation, so mobile WebViews
    // otherwise retain the previous screen's scroll position.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector(".app")?.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        setUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          localStorage.removeItem("oatle-age-group");
          setAgeGroup(null);
          setScreen("home");
        }

        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      if (!user) {
        if (mounted) {
          setHasAccess(false);
          setAccessLoading(false);
        }
        return;
      }

      setAccessLoading(true);

      const { data, error } = await supabase
        .from("entitlements")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Access check failed:", error);
        setHasAccess(false);
        setAccessLoading(false);
        return;
      }

      const active =
        data?.status === "active" &&
        (!data.expires_at ||
          new Date(data.expires_at) > new Date());

      setHasAccess(active);
      setAccessLoading(false);
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [user]);

  const planet =
    planets.find(
      (item) => item.id === progress.activePlanet
    ) || planets[0];

  const missionQuestions = useMemo(
    () =>
      planet.id === 8
        ? planet.questions
        : planet.id === 9
          ? plutoQuestions
          : shuffleArray(planet.questions),
    [planet.id, planet.questions]
  );

  const question =
    missionQuestions[progress.question] ||
    missionQuestions[0];

  const [loadedQuestionImage, setLoadedQuestionImage] =
    useState(null);

  const questionImageLoaded =
    !question?.image || loadedQuestionImage === question.image;

  useEffect(() => {
    const nextQuestion = missionQuestions[progress.question + 1];

    if (!nextQuestion?.image) return;

    const preload = new Image();
    preload.src = nextQuestion.image;
  }, [missionQuestions, progress.question]);

  const options = useMemo(() => {
    if (!question || planet.id === 8) {
      return [];
    }

    if (
      planet.id === 5 ||
      question.type === "reading"
    ) {
      return generateReadingOptions(
        question.answer
      );
    }

    if (
      planet.id === 6 ||
      question.type === "missing"
    ) {
      return generateMissingLettersOptions(
        question.answer
      );
    }

    if (
      planet.id === 7 ||
      question.type === "sentences"
    ) {
      return generateSentenceOptions(
        question.words
      );
    }

    return generateOptions(question.answer);
  }, [question, planet.id]);

  const wordOrderOptions = useMemo(() => {
    if (!question || planet.id !== 4) {
      return [];
    }

    const items = question.letters.map(
      (letter, index) => ({ letter, index })
    );

    let shuffled = shuffleArray(items);
    let attempts = 0;

    while (
      items.length > 1 &&
      shuffled.every(
        (item, index) => item.index === index
      ) &&
      attempts < 10
    ) {
      shuffled = shuffleArray(items);
      attempts += 1;
    }

    return shuffled;
  }, [question, planet.id]);

  useEffect(() => {
    const savedProgress = {
      ...progress,
      missions: {
        ...progress.missions,
        [progress.activePlanet]: progress.question,
      },
    };

    localStorage.setItem(
      "atli-space-progress",
      JSON.stringify(savedProgress)
    );
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(
      "atli-writing-progress",
      JSON.stringify(writingProgress)
    );
  }, [writingProgress]);

  useEffect(() => {
    localStorage.setItem(
      "oatle-child-profile",
      JSON.stringify(childProfile)
    );
  }, [childProfile]);

  useEffect(() => {
    if (assessmentResults) {
      localStorage.setItem(
        "atli-space-assessment-results",
        JSON.stringify(assessmentResults)
      );
    }
  }, [assessmentResults]);

  useEffect(() => {
    localStorage.setItem(
      READING_ASSESSMENT_ATTEMPT_KEY,
      JSON.stringify({
        active: readingAssessmentActive,
        scores: assessmentScores,
      })
    );
  }, [assessmentScores, readingAssessmentActive]);

  /*
   * Central reading speech.
   *
   * Mars uses whole-word TTS. Neptune reads each story page aloud.
   * Pluto keeps reading answers silent because it is an assessment.
   */
  useEffect(() => {
    if (
      !soundOn ||
      screen !== "mission" ||
      !question
    ) {
      return;
    }

    const isWordOrder =
      planet.id === 4 || question.type === "word-order";

    if (isWordOrder) {
      const timer = setTimeout(() => {
        speak(`Listen to the word ${question.word}. Put its letters in the right order.`);
      }, 250);

      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    }

    const isPlutoReading =
      planet.id === 9 &&
      (question.skill === "reading" ||
        question.type === "reading");

    if (isPlutoReading) {
      return;
    }

    const speechText = getSpeechText(
      planet.id,
      question
    );

    if (!speechText) {
      return;
    }

    const timer = setTimeout(() => {
      speak(speechText);
    }, 250);

    return () => {
      clearTimeout(timer);
      stopSpeech();
    };
  }, [
    screen,
    planet.id,
    progress.question,
    question,
    soundOn,
  ]);

  /*
   * The Littles area narrates every important transition. Mirror that
   * behaviour across the Big Kids menus, maps, planet introductions,
   * free drawing, and celebrations. Activity questions are handled by
   * their own focused speech effects so voices never overlap.
   */
  useEffect(() => {
    if (!soundOn || ageGroup !== "big") {
      return undefined;
    }

    const selectedWritingPlanet =
      writingPlanets.find(
        (item) => item.id === writingActivePlanet
      ) || writingPlanets[0];

    const completedWritingPlanet =
      writingPlanets.find(
        (item) => item.id === writingCelebrationMission
      ) || selectedWritingPlanet;

    const launchPrompts = {
      reading:
        "Reading Adventures. Travel across the planets and build your reading skills.",
      counting:
        "Maths Adventures. Count, match, add, and explore numbers among the stars.",
      writing:
        "Writing Adventures. Trace letters, numbers, shapes, and sentences.",
    };

    const prompts = {
      explore:
        "Choose a learning adventure. Reading, counting, or writing.",
      launch: launchPrompts[launchAdventure],
      map: "Choose a planet for your next reading mission.",
      planet: `Welcome to planet ${planet.name}. ${planet.description}.`,
      celebration: `Mission accomplished! You completed your mission on ${planet.name}.`,
      writingMap:
        "Choose a writing planet, or open the Scribbler to draw freely.",
      writingPlanet: `Welcome to planet ${selectedWritingPlanet.name}. ${selectedWritingPlanet.description}.`,
      writingCelebration: `Mission accomplished! You completed your writing mission on ${completedWritingPlanet.name}.`,
      scribbler:
        "Welcome to the Scribbler. Draw, write, erase, and add stickers to your picture.",
    };

    const prompt = prompts[screen];
    if (!prompt) {
      return undefined;
    }

    const narrationDelay =
      screen === "celebration" || screen === "writingCelebration"
        ? 7800
        : 240;

    const timer = window.setTimeout(() => {
      speak(prompt);
    }, narrationDelay);

    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [
    ageGroup,
    launchAdventure,
    planet.description,
    planet.name,
    screen,
    soundOn,
    writingActivePlanet,
    writingCelebrationMission,
  ]);

  useEffect(() => {
    if (!soundOn || screen !== "mission" || !feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      speak(feedback);
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [feedback, screen, soundOn]);

  useEffect(() => {
    const bigKidsHomeVisible = Boolean(
      user?.id &&
      !authLoading &&
      !accessLoading &&
      hasAccess &&
      ageGroup === "big" &&
      screen === "home"
    );

    if (!soundOn || !bigKidsHomeVisible) {
      stopAudioRef(welcomeAudioRef);
      return undefined;
    }

    const effect = new Audio(welcomeSound);
    effect.volume = 1;
    welcomeAudioRef.current = effect;
    effect.play().catch(() => {
      if (welcomeAudioRef.current === effect) {
        welcomeAudioRef.current = null;
      }
    });

    return () => {
      stopAudioRef(welcomeAudioRef);
    };
  }, [
    accessLoading,
    ageGroup,
    authLoading,
    hasAccess,
    screen,
    soundOn,
    user?.id,
  ]);

  useEffect(() => {
    const celebrationVisible = Boolean(
      user?.id &&
      !authLoading &&
      !accessLoading &&
      hasAccess &&
      ageGroup === "big" &&
      (screen === "celebration" || screen === "writingCelebration")
    );

    if (!soundOn || !celebrationVisible) {
      stopAudioRef(victoryAudioRef);
      return undefined;
    }

    stopAudioRef(effectAudioRef);

    const effect = new Audio(victorySound);
    effect.volume = 0.55;
    victoryAudioRef.current = effect;
    effect.play().catch(() => {
      if (victoryAudioRef.current === effect) {
        victoryAudioRef.current = null;
      }
    });

    return () => {
      stopAudioRef(victoryAudioRef);
    };
  }, [
    accessLoading,
    ageGroup,
    authLoading,
    hasAccess,
    screen,
    soundOn,
    user?.id,
  ]);

  useEffect(() => {
    return () => {
      stopAudioRef(effectAudioRef);
    };
  }, [screen, progress.question]);

  useEffect(() => {
    return () => {
      stopAudioRef(welcomeAudioRef);
      stopAudioRef(victoryAudioRef);
      stopAudioRef(effectAudioRef);
    };
  }, []);

  const playSound = (sound) => {
    if (!soundOn) return;

    stopAudioRef(effectAudioRef);

    const effect = new Audio(sound);
    effect.volume = 0.55;
    effectAudioRef.current = effect;
    effect.addEventListener(
      "ended",
      () => {
        if (effectAudioRef.current === effect) {
          effectAudioRef.current = null;
        }
      },
      { once: true }
    );
    effect.play().catch(() => {
      if (effectAudioRef.current === effect) {
        effectAudioRef.current = null;
      }
    });
  };

  const goToPlanet = (id) => {
    setProgress((current) => {
      const saved = savedGame();
      const missions = {
        ...saved.missions,
        ...current.missions,
        [current.activePlanet]: current.question,
      };

      return {
        ...current,
        missions,
        activePlanet: id,
        question: missions[id] || 0,
      };
    });

    setFeedback("");
    setBuiltSentence([]);
    setBuiltWord([]);
    setIsProcessing(false);
    setRevealedAnswer("");

    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
    }

    setScreen("planet");
  };

  const startPlutoAssessment = () => {
    const savedAttempt = savedReadingAssessmentAttempt();

    if (!savedAttempt.active) {
      setAssessmentScores(emptyPlutoResults());
      setReadingAssessmentActive(true);
    } else {
      setAssessmentScores(savedAttempt.scores);
    }

    setProgress((current) => ({
      ...current,
      question: savedAttempt.active
        ? current.missions?.[9] || current.question || 0
        : 0,
    }));

    setBuiltSentence([]);
    setBuiltWord([]);
    setFeedback("");
    setIsProcessing(false);
    setRevealedAnswer("");
    setScreen("mission");
  };

  const savePlutoAnswer = (isCorrect) => {
    const nextScores = {
      ...assessmentScores,
      [question.skill]: {
        ...assessmentScores[question.skill],
        correct:
          assessmentScores[question.skill].correct +
          (isCorrect ? 1 : 0),
      },
    };

    setAssessmentScores(nextScores);

    return nextScores;
  };

  const finishPlutoAssessment = (scores) => {
    setAssessmentResults(scores);
    setReadingAssessmentActive(false);
    setScreen("celebration");
  };

  const advancePlutoAssessment = (
    scores,
    message,
    delay = 1200
  ) => {
    setFeedback(message);
    setIsProcessing(true);

    advanceTimer.current = setTimeout(() => {
      if (progress.question < missionQuestions.length - 1) {
        setProgress((current) => ({
          ...current,
          question: current.question + 1,
        }));
        setBuiltSentence([]);
        setBuiltWord([]);
        setRevealedAnswer("");
        setFeedback("");
        setIsProcessing(false);
        return;
      }

      finishPlutoAssessment(scores);
      setIsProcessing(false);
    }, delay);
  };

  const previousStoryPage = () => {
    if (progress.question === 0) {
      return;
    }

    setProgress((current) => ({
      ...current,
      question: current.question - 1,
    }));
  };

  const nextStoryPage = () => {
    if (
      progress.question <
      missionQuestions.length - 1
    ) {
      setProgress((current) => ({
        ...current,
        question: current.question + 1,
      }));

      return;
    }

    setScreen("celebration");
  };

  const removeSentenceWord = (index) => {
    if (isProcessing) {
      return;
    }

    setBuiltSentence((current) =>
      current.filter(
        (_, wordIndex) =>
          wordIndex !== index
      )
    );

    setFeedback("");
  };

  const selectSentenceWord = (word) => {
    if (
      isProcessing ||
      builtSentence.length >=
        question.words.length
    ) {
      return;
    }

    const expectedWord =
      question.words[
        builtSentence.length
      ];

    const correctWord =
      word === expectedWord;

    if (correctWord) {
      playSound(correctSound);
    } else {
      playSound(wrongSound);
    }

    const nextSentence = [
      ...builtSentence,
      word,
    ];

    setBuiltSentence(nextSentence);
    setFeedback(
      correctWord
        ? ""
        : "Almost! Try another word."
    );

    if (
      nextSentence.length !==
      question.words.length
    ) {
      return;
    }

    const correct = nextSentence.every(
      (item, index) =>
        item === question.words[index]
    );

    if (!correct) {
      if (planet.id === 9) {
        const nextScores = savePlutoAnswer(false);
        advancePlutoAssessment(
          nextScores,
          `Not quite. The correct sentence is “${question.words.join(" ")}.”`
        );
      }
      return;
    }

    const nextScores =
      planet.id === 9
        ? savePlutoAnswer(true)
        : null;

    setFeedback(
      BIG_KIDS_PRAISE[
        progress.question % BIG_KIDS_PRAISE.length
      ]
    );
    setIsProcessing(true);

    advanceTimer.current = setTimeout(() => {
      if (
        progress.question <
        missionQuestions.length - 1
      ) {
        setProgress((current) => ({
          ...current,
          question: current.question + 1,
        }));

        setBuiltSentence([]);
        setFeedback("");
        setIsProcessing(false);

        return;
      }

      if (planet.id === 9) {
        finishPlutoAssessment(
          nextScores
        );
      } else {
        setScreen("celebration");
      }

      setIsProcessing(false);
    }, 3000);
  };

  const selectWordOrderLetter = (letterIndex) => {
    if (isProcessing) {
      return;
    }

    if (
      builtWord.some(
        (item) => item.index === letterIndex
      )
    ) {
      return;
    }

    const selectedLetter =
      question.letters[letterIndex];

    const expectedLetter =
      question.answer[builtWord.length];

    if (
      selectedLetter !==
      expectedLetter
    ) {
      playSound(wrongSound);
      if (planet.id === 9) {
        const nextScores = savePlutoAnswer(false);
        advancePlutoAssessment(
          nextScores,
          `Not quite. The word is “${question.word}.”`
        );
        return;
      }
      setFeedback(
        "Almost! Try another star."
      );
      return;
    }

    playSound(correctSound);
    setFeedback("");

    const nextWord = [
      ...builtWord,
      {
        letter: selectedLetter,
        index: letterIndex,
      },
    ];

    setBuiltWord(nextWord);

    if (
      nextWord.length !==
      question.letters.length
    ) {
      return;
    }

    setIsProcessing(true);
    setFeedback("Great listening! You built the word.");

    if (planet.id === 9) {
      const nextScores = savePlutoAnswer(true);
      advancePlutoAssessment(nextScores, "Great listening!");
      return;
    }

    advanceTimer.current = setTimeout(() => {
      if (
        progress.question <
        missionQuestions.length - 1
      ) {
        setProgress((current) => ({
          ...current,
          question: current.question + 1,
        }));

        setBuiltWord([]);
        setFeedback("");
        setIsProcessing(false);
        return;
      }

      setScreen("celebration");

      setIsProcessing(false);
    }, 3000);
  };

  const answer = (selectedAnswer) => {
    if (isProcessing) {
      return;
    }

    if (
      selectedAnswer !== question.answer
    ) {
      playSound(wrongSound);

      if (planet.id === 9) {
        const nextScores = savePlutoAnswer(false);
        advancePlutoAssessment(
          nextScores,
          `Not quite. The correct answer is “${question.answer}.”`
        );
        return;
      }

      if (planet.id === 6) {
        setFeedback("Almost! Try another letter.");
      } else {
        setFeedback(
          "Almost! Try another star."
        );
      }

      return;
    }

    playSound(correctSound);

    const praise =
      BIG_KIDS_PRAISE[
        progress.question % BIG_KIDS_PRAISE.length
      ];

    setFeedback(praise);

    const nextScores =
      planet.id === 9
        ? savePlutoAnswer(true)
        : null;

    if (
      planet.id === 6 ||
      question.type === "reading"
    ) {
      setIsProcessing(true);
      setRevealedAnswer(
        selectedAnswer
      );

      advanceTimer.current = setTimeout(() => {
        if (
          progress.question <
          missionQuestions.length - 1
        ) {
          setProgress((current) => ({
            ...current,
            question:
              current.question + 1,
          }));

          setRevealedAnswer("");
          setFeedback("");
          setIsProcessing(false);

          return;
        }

        if (planet.id === 9) {
          finishPlutoAssessment(
            nextScores
          );
        } else {
          setScreen("celebration");
        }

        setIsProcessing(false);
      }, 3000);

      return;
    }

    setIsProcessing(true);

    advanceTimer.current = setTimeout(() => {
      if (
        progress.question <
        missionQuestions.length - 1
      ) {
        setProgress((current) => ({
          ...current,
          question:
            current.question + 1,
        }));
        setFeedback("");
        setIsProcessing(false);
        return;
      }

      if (planet.id === 9) {
        finishPlutoAssessment(
          nextScores
        );
      } else {
        setScreen("celebration");
      }

      setIsProcessing(false);
    }, 1100);
  };

  const completeWritingMission = (
    missionId
  ) => {
    setWritingProgress((current) => ({
      ...current,
      missions: {
        ...current.missions,
        [missionId]: 0,
      },
    }));
    setWritingCelebrationMission(missionId);
    setScreen("writingCelebration");
  };

  const startWritingPlanet = (planetId) => {
    const selectedPlanet =
      writingPlanets.find(
        (item) => item.id === planetId
      );

    if (
      !selectedPlanet ||
      planetId > writingProgress.unlocked
    ) {
      return;
    }

    setWritingActivePlanet(
      planetId
    );

    setScreen("writingPlanet");
  };

  const unlockNextWritingPlanet = () => {
    const completedId =
      writingCelebrationMission ||
      writingActivePlanet;

    const nextPlanetId =
      completedId + 1;

    if (
      nextPlanetId >
      writingPlanets.length
    ) {
      setWritingCelebrationMission(
        null
      );

      setScreen("writingMap");
      return;
    }

    const nextPlanet =
      writingPlanets.find(
        (item) =>
          item.id === nextPlanetId
      );

    setWritingProgress((current) => ({
      ...current,
      unlocked: Math.max(
        current.unlocked,
        nextPlanetId
      ),
    }));

    setWritingActivePlanet(
      nextPlanetId
    );

    setWritingCelebrationMission(
      null
    );

    setScreen(
      nextPlanet
        ? "writingPlanet"
        : "writingMap"
    );
  };

  const saveWritingMissionStep = (
    missionId,
    step
  ) => {
    setWritingProgress((current) => {
      if (current.missions?.[missionId] === step) {
        return current;
      }

      return {
        ...current,
        missions: {
          ...current.missions,
          [missionId]: step,
        },
      };
    });
  };

  const unlockNext = () => {
    const nextPlanetId =
      planet.id + 1;

    const unlockedPlanet =
      planets.find(
        (item) =>
          item.id === nextPlanetId
      );

    if (
      nextPlanetId >
      planets.length
    ) {
      setScreen("map");
      return;
    }

    setProgress((current) => ({
      ...current,
      unlocked: Math.max(
        current.unlocked,
        nextPlanetId
      ),
      activePlanet: nextPlanetId,
      question:
        current.missions?.[nextPlanetId] || 0,
    }));

    setScreen(
      unlockedPlanet
        ? "planet"
        : "map"
    );
  };

  const resetProgress = () => {
    setProgress({
      unlocked: 1,
      activePlanet: 1,
      question: 0,
      missions: {},
      startedMissions: {},
    });

    setWritingProgress({
      unlocked: 1,
      missions: {},
      startedMissions: {},
    });

    setWritingActivePlanet(1);
    setWritingCelebrationMission(null);
    localStorage.removeItem("oatle-little-explorers-progress");
    localStorage.removeItem("oatle-little-explorers-started");
    localStorage.removeItem("oatle-balloon-learning-session");

    setScreen(ageGroup === "little" ? "littleExplorers" : "home");
  };

  const selectAgeGroup = (group) => {
    localStorage.setItem("oatle-age-group", group);
    setAgeGroup(group);
    setScreen(group === "little" ? "littleExplorers" : "home");
  };

  // PayFast test checkout
  const startPayfastCheckout = async () => {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      // Get the currently logged-in user's session.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "No authenticated session found."
        );
      }

      // Explicitly send the user's JWT to the Edge Function.
      const { data, error } =
        await supabase.functions.invoke(
          "quick-service",
          {
            body: {},
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

      if (error) throw error;

      if (
        !data?.checkout_url ||
        !data?.fields
      ) {
        throw new Error(
          "PayFast checkout response was incomplete."
        );
      }

      const form =
        document.createElement("form");

      form.method = "POST";
      form.action = data.checkout_url;
      form.style.display = "none";

      Object.entries(data.fields).forEach(
        ([name, value]) => {
          const input =
            document.createElement(
              "input"
            );

          input.type = "hidden";
          input.name = name;
          input.value = String(
            value ?? ""
          );

          form.appendChild(input);
        }
      );

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error(
        "PayFast checkout error:",
        error
      );

      setPaymentError(
        "We couldn't open the payment page. Please try again."
      );

      setPaymentLoading(false);
    }
  };

  const redeemPromoCode = async () => {
    const code =
      promoCode.trim();

    if (!code) {
      setPromoMessage(
        "Please enter a promo code."
      );
      return;
    }

    setPromoLoading(true);
    setPromoMessage("");

    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "No authenticated session found."
        );
      }

      const { data, error } =
        await supabase.functions.invoke(
          "hyper-action",
          {
            body: {
              code,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Promo code could not be redeemed."
        );
      }

      setPromoMessage(
        data.message ||
          "Promo code redeemed successfully."
      );

      // Refresh access after the entitlement is created.
      setAccessLoading(true);

      const {
        data: entitlement,
        error: accessError,
      } = await supabase
        .from("entitlements")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (accessError) {
        console.error(
          "Access refresh failed:",
          accessError
        );

        setHasAccess(false);
      } else {
        const active =
          entitlement?.status ===
            "active" &&
          (!entitlement.expires_at ||
            new Date(
              entitlement.expires_at
            ) > new Date());

        setHasAccess(active);
      }

      setAccessLoading(false);
    } catch (error) {
      console.error(
        "Promo redemption error:",
        error
      );

      setPromoMessage(
        error?.message ||
          "We couldn't redeem that promo code. Please try again."
      );

      setAccessLoading(false);
    } finally {
      setPromoLoading(false);
    }
  };

  const action = (
    label,
    handler,
    className = "primary-button"
  ) => (
    <button
      className={className}
      onClick={handler}
      type="button"
    >
      {label}
    </button>
  );

  let content;

  if (authLoading) {
    content = (
      <main className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-mark">
              O
            </div>
          </div>

          <p className="eyebrow">
            OATLE KIDS
          </p>

          <h1>
            Launching...
          </h1>

          <p className="login-intro">
            Getting your space adventure ready.
          </p>
        </div>
      </main>
    );
  } else if (!user) {
    content = (
      <LoginPage
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          localStorage.removeItem("oatle-age-group");
          setAgeGroup(null);
          setScreen("ageSelect");
        }}
      />
    );
  } else if (accessLoading) {
    content = (
      <main className="login-page">
        <div className="login-card">
          <p className="eyebrow">
            OATLE KIDS
          </p>

          <h1>
            Checking access...
          </h1>

          <p className="login-intro">
            Getting your space adventure ready.
          </p>
        </div>
      </main>
    );
  } else if (!hasAccess) {
    content = (
      <main className="login-page">
        <div className="login-card">
          <p className="eyebrow">
            OATLE KIDS
          </p>

          <h1>
            Access required
          </h1>

          <p className="login-intro">
            Your account is ready, but it does not have access to Oatle Kids yet.
          </p>

          <p className="login-intro">
            Subscribe for R79/month, or enter a promo code to get access.
          </p>

          <button
            className="primary-button"
            onClick={
              startPayfastCheckout
            }
            disabled={paymentLoading}
            type="button"
          >
            {paymentLoading
              ? "Opening payment..."
              : "Subscribe — R79/month"}
          </button>

          {paymentError && (
            <p
              className="payment-error"
              role="alert"
            >
              {paymentError}
            </p>
          )}

          <p
            className="login-intro"
            style={{
              marginTop: "20px",
            }}
          >
            Have a promo code?
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              redeemPromoCode();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <input
              type="text"
              value={promoCode}
              onChange={(event) => {
                setPromoCode(
                  event.target.value
                );
                setPromoMessage("");
              }}
              placeholder="Enter promo code"
              aria-label="Promo code"
              autoComplete="off"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
                background:
                  "rgba(255,255,255,0.06)",
                color: "inherit",
                font: "inherit",
              }}
            />

            <button
              className="primary-button"
              type="submit"
              disabled={promoLoading}
            >
              {promoLoading
                ? "Redeeming..."
                : "Redeem promo code"}
            </button>

            {promoMessage && (
              <p
                className="login-intro"
                role="status"
                aria-live="polite"
              >
                {promoMessage}
              </p>
            )}
          </form>

          <button
            className="secondary-button"
            onClick={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setHasAccess(false);
              setAgeGroup(null);
            }}
            type="button"
          >
            Return to login
          </button>
        </div>
      </main>
    );
  } else if (!ageGroup) {
    content = (
      <main className="age-choice-page">
        <div className="age-choice-panel">
          <p className="eyebrow">CHOOSE AN ADVENTURE</p>
          <h1>How old is your little explorer?</h1>
          <p className="age-choice-intro">
            Pick the age group that fits the child playing today.
          </p>

          <div className="age-choice-grid" aria-label="Choose a child age group">
            <button
              className="age-choice-card age-choice-little"
              onClick={() => selectAgeGroup("little")}
              type="button"
            >
              <span className="age-choice-icon">
                <LittleExplorerIcon />
              </span>
              <strong>Ages 2–3</strong>
              <span>Little Space Adventures</span>
              <small>Big taps, happy boops and playful exploring</small>
            </button>

            <button
              className="age-choice-card age-choice-big"
              onClick={() => selectAgeGroup("big")}
              type="button"
            >
              <span className="age-choice-icon">
                <BookIcon />
              </span>
              <strong>Ages 4–7</strong>
              <span>Space Learning Adventures</span>
              <small>Reading, counting, writing and assessments</small>
            </button>
          </div>

          <p className="age-choice-note">
            You can change age groups later in Settings.
          </p>
        </div>
      </main>
    );
  } else if (
    screen === "explore"
  ) {
    content = (
      <main className="page adventure-hub">
        <p className="eyebrow">
          LET'S EXPLORE
        </p>

        <h1>
          What shall we explore?
        </h1>

        <p className="page-intro">
          Pick an adventure and
          let's go!
        </p>

        <div className="adventure-grid">
          <button
            className="adventure-card"
            onClick={() => {
              setLaunchAdventure(
                "reading"
              );
              setScreen("launch");
            }}
            type="button"
          >
            <span className="adventure-card-icon">
              <BookIcon />
            </span>

            <strong>
              Reading
            </strong>
            <small>Ages 4–7</small>
          </button>

          <button
            className="adventure-card"
            onClick={() => {
              setLaunchAdventure(
                "counting"
              );
              setScreen("launch");
            }}
            type="button"
          >
            <span className="adventure-card-icon">
              <NumberIcon />
            </span>

            <strong>
              Counting
            </strong>
            <small>Ages 4–7</small>
          </button>

          <button
            className="adventure-card"
            onClick={() => {
              setLaunchAdventure(
                "writing"
              );
              setScreen("launch");
            }}
            type="button"
          >
            <span className="adventure-card-icon">
              <PencilIcon />
            </span>

            <strong>
              Writing
            </strong>
            <small>Ages 4–7</small>
          </button>

        </div>
      </main>
    );
  } else if (
    screen === "littleExplorers"
  ) {
    content = (
      <LittleExplorers
        backLabel={ageGroup === "little" ? "Age groups" : "Explore"}
        onBack={() => {
          if (ageGroup === "little") {
            localStorage.removeItem("oatle-age-group");
            setAgeGroup(null);
            setScreen("ageSelect");
            return;
          }

          setScreen("explore");
        }}
        soundOn={soundOn}
      />
    );
  } else if (
    screen === "writingMap"
  ) {
    content = (
      <main className="page writing-map-page">
        <LocalBackButton
          className="page-back-button"
          label="Explore"
          onClick={() => setScreen("explore")}
        />
        <p className="eyebrow">
          YOUR JOURNEY
        </p>

        <h1>
          Writing Planet Map
        </h1>

        <p className="page-intro">
          Complete each planet to unlock the next writing adventure.
        </p>

        <div className="planet-map writing-map">
          {writingPlanets.map(
            (item) => {
              const locked =
                item.id >
                writingProgress.unlocked;

              return (
                <button
                  key={item.id}
                  className={`planet-card ${
                    locked
                      ? "locked"
                      : ""
                  }`}
                  style={{
                    "--planet":
                      item.color,
                  }}
                  disabled={locked}
                  onClick={() =>
                    startWritingPlanet(
                      item.id
                    )
                  }
                  type="button"
                >
                  {locked ? (
                    <span className="writing-map-lock">
                      🔒
                    </span>
                  ) : (
                    <PlanetVisual
                      planet={item}
                      className="planet-art"
                    />
                  )}

                  <strong>
                    {item.name}
                  </strong>

                  <small>
                    {locked
                      ? "Complete the previous planet"
                      : item.description}
                  </small>
                </button>
              );
            }
          )}

          <button
            className="planet-card writing-map-free"
            type="button"
            onClick={() =>
              setScreen("scribbler")
            }
          >
            <span className="writing-map-icon">
              ✏️
            </span>

            <strong>
              Scribbler
            </strong>

            <small>
              Write, draw and explore freely.
            </small>
          </button>
        </div>
      </main>
    );
  } else if (
    screen === "writingPlanet"
  ) {
    const selectedWritingPlanet =
      writingPlanets.find(
        (item) =>
          item.id ===
          writingActivePlanet
      ) ||
      writingPlanets[0];

    const writingMissionStarted = Boolean(
      writingProgress.startedMissions?.[selectedWritingPlanet.id] ||
      (writingProgress.missions?.[selectedWritingPlanet.id] || 0) > 0
    );

    content = (
      <main className="planet-overview writing-planet-overview">
        <LocalBackButton
          className="page-back-button"
          label="Writing map"
          onClick={() => setScreen("writingMap")}
        />
        <PlanetVisual
          planet={
            selectedWritingPlanet
          }
          className="planet-icon planet-art"
        />

        <p className="eyebrow">
          PLANET{" "}
          {
            selectedWritingPlanet.id
          }
        </p>

        <h1>
          Welcome to Planet{" "}
          {
            selectedWritingPlanet.name
          }
        </h1>

        <p>
          {
            selectedWritingPlanet.description
          }. Get ready for your writing mission.
        </p>

        {action(
          writingMissionStarted
            ? "Return to mission"
            : "Start mission",
          () => {
            setWritingProgress((current) => ({
              ...current,
              startedMissions: {
                ...current.startedMissions,
                [selectedWritingPlanet.id]: true,
              },
            }));

            setScreen(
              selectedWritingPlanet.mission
            );
          }
        )}
      </main>
    );
  } else if (
    screen === "writingCelebration"
  ) {
    const completedWritingPlanet =
      writingPlanets.find(
        (item) =>
          item.id ===
          writingCelebrationMission
      ) ||
      writingPlanets[0];

    const hasNextWritingPlanet =
      completedWritingPlanet.id <
      writingPlanets.length;

    content = (
      <main className="celebration-panel">
        <LocalBackButton
          className="page-back-button"
          label="Writing map"
          onClick={() => setScreen("writingMap")}
        />
        <p className="eyebrow">
          MISSION COMPLETE
        </p>

        <h1>
          Mission accomplished!
        </h1>

        <p className="celebration-message">
          You completed your writing mission on{" "}
          {
            completedWritingPlanet.name
          }.
        </p>

        <PlanetVisual
          planet={
            completedWritingPlanet
          }
          className="celebration-planet planet-art"
        />

        <p className="celebration-subject">
          WRITING
        </p>

        <p className="celebration-description">
          {
            completedWritingPlanet.description
          }
        </p>

        <div className="celebration-actions">
          {hasNextWritingPlanet
            ? action(
                "Unlock next planet →",
                unlockNextWritingPlanet
              )
            : action(
                "Back to writing map",
                () => {
                  setWritingCelebrationMission(
                    null
                  );

                  setScreen(
                    "writingMap"
                  );
                },
                "secondary-button"
              )}
        </div>
      </main>
    );
  } else if (
    screen === "scribbler"
  ) {
    content = (
      <Scribbler
        onBack={() =>
          setScreen("writingMap")
        }
      />
    );
  } else if (
    screen === "writingMission1"
  ) {
    content = (
      <AlphabetTracingMission
        soundOn={soundOn}
        onBack={() =>
          setScreen(
            "writingPlanet"
          )
        }
        onComplete={() =>
          completeWritingMission(1)
        }
        initialStep={
          writingProgress.missions?.[1] || 0
        }
        onProgress={(step) =>
          saveWritingMissionStep(1, step)
        }
      />
    );
  } else if (
    screen === "writingMission2"
  ) {
    content = (
      <NumberTracingMission
        soundOn={soundOn}
        onBack={() =>
          setScreen(
            "writingPlanet"
          )
        }
        onComplete={() =>
          completeWritingMission(2)
        }
        initialStep={
          writingProgress.missions?.[2] || 0
        }
        onProgress={(step) =>
          saveWritingMissionStep(2, step)
        }
      />
    );
  } else if (
    screen === "writingMission3"
  ) {
    content = (
      <ShapeTracingMission
        soundOn={soundOn}
        onBack={() =>
          setScreen(
            "writingPlanet"
          )
        }
        onComplete={() =>
          completeWritingMission(3)
        }
        initialStep={
          writingProgress.missions?.[3] || 0
        }
        onProgress={(step) =>
          saveWritingMissionStep(3, step)
        }
      />
    );
  } else if (
    screen === "writingMission4"
  ) {
    content = (
      <SentenceWritingMission
        soundOn={soundOn}
        onBack={() =>
          setScreen(
            "writingPlanet"
          )
        }
        onComplete={() =>
          completeWritingMission(4)
        }
        initialStep={
          writingProgress.missions?.[4] || 0
        }
        onProgress={(step) =>
          saveWritingMissionStep(4, step)
        }
        childProfile={childProfile}
      />
    );
  } else if (
    screen === "home"
  ) {
    content = (
      <main className="hero-panel">
        <img
          src="/oatle-kids-wordmark.webp"
          alt="Oatle Kids"
          className="hero-logo"
        />

        <p className="eyebrow">
          WELCOME, CAPTAIN
        </p>

        <h1>
          Ready for a stellar
          adventure?
        </h1>

        <p>
          Explore learning
          adventures across
          letters, reading,
          maths, and the
          planets.
        </p>

        <div className="button-row">
          {action(
            "Explore",
            () => {
              setScreen("explore");
            }
          )}

          {assessmentResults &&
            action(
              "Parent Results",
              () =>
                setScreen(
                  "results"
                ),
              "secondary-button"
            )}
        </div>
      </main>
    );
  } else if (
    screen === "math"
  ) {
    content = (
      <MathSection
        onHome={() =>
          setScreen("home")
        }
        onBack={() =>
          setScreen("explore")
        }
        soundOn={soundOn}
      />
    );
  } else if (
    screen === "launch"
  ) {
    const launchContent = {
      reading: {
        eyebrow:
          "READING MISSION",
        title:
          "Ready to explore the planets?",
        description:
          "Travel across the solar system and build your reading skills one star at a time.",
        button:
          "View planet map",
        nextScreen: "map",
      },

      counting: {
        eyebrow:
          "COUNTING MISSION",
        title:
          "Ready to count among the stars?",
        description:
          "Practice numbers, counting, and early maths skills in a playful space adventure.",
        button:
          "Start counting",
        nextScreen: "math",
      },

      writing: {
        eyebrow:
          "WRITING MISSION",
        title:
          "Ready to write among the stars?",
        description:
          "Trace letters, numbers, shapes, and simple sentences across your writing planets.",
        button:
          "View writing map",
        nextScreen:
          "writingMap",
      },
    }[launchAdventure] || {
      eyebrow:
        "MISSION CONTROL",
      title:
        "Your mission is ready!",
      description:
        "Choose an adventure and begin exploring.",
      button: "Explore",
      nextScreen: "explore",
    };

    content = (
      <main
        className={`launch-panel launch-${launchAdventure}`}
      >
        <LocalBackButton
          className="page-back-button"
          label="Explore"
          onClick={() => setScreen("explore")}
        />
        <div
          className="countdown-orbit"
          aria-hidden="true"
        >
          <span>3</span>
          <span>2</span>
          <span>1</span>
          <b>🚀</b>
        </div>

        <p className="eyebrow">
          {
            launchContent.eyebrow
          }
        </p>

        <h1>
          {
            launchContent.title
          }
        </h1>

        <p>
          {
            launchContent.description
          }
        </p>

        {action(
          launchContent.button,
          () =>
            setScreen(
              launchContent.nextScreen
            )
        )}
      </main>
    );
  } else if (
    screen === "map"
  ) {
    content = (
      <main className="page">
        <LocalBackButton
          className="page-back-button"
          label="Explore"
          onClick={() => setScreen("explore")}
        />
        <p className="eyebrow">
          YOUR JOURNEY
        </p>

        <h1>
          Planet Map
        </h1>

        <p className="page-intro">
          Complete each planet to
          unlock the next destination.
        </p>

        <div className="planet-map">
          {planets.map(
            (item) => {
              const locked =
                item.id >
                progress.unlocked;

              return (
                <button
                  key={item.id}
                  className={`planet-card ${
                    locked
                      ? "locked"
                      : ""
                  }`}
                  style={{
                    "--planet":
                      item.color,
                  }}
                  disabled={locked}
                  onClick={() =>
                    goToPlanet(
                      item.id
                    )
                  }
                  type="button"
                >
                  {locked ? (
                    <span>
                      🔒
                    </span>
                  ) : (
                    <PlanetVisual
                      planet={item}
                      className="planet-art"
                    />
                  )}

                  <strong>
                    {item.name}
                  </strong>

                  <small>
                    {locked
                      ? "Complete the previous planet"
                      : item.description}
                  </small>
                </button>
              );
            }
          )}
        </div>
      </main>
    );
  } else if (
    screen === "planet"
  ) {
    const readingMissionStarted = Boolean(
      progress.startedMissions?.[planet.id] ||
      (progress.missions?.[planet.id] || 0) > 0 ||
      (progress.activePlanet === planet.id && progress.question > 0)
    );

    content = (
      <main className="planet-overview">
        <LocalBackButton
          className="page-back-button"
          label="Reading map"
          onClick={() => setScreen("map")}
        />
        <PlanetVisual
          planet={planet}
          className="planet-icon planet-art"
        />

        <p className="eyebrow">
          PLANET {planet.id}
        </p>

        <h1>
          Welcome to Planet{" "}
          {planet.name}
        </h1>

        <p>
          {planet.id === 8
            ? `${planet.description}. Turn the pages and read the story.`
            : `${planet.description}. You have ${missionQuestions.length} stars to collect.`}
        </p>

        {action(
          planet.id === 8
            ? readingMissionStarted
              ? "Return to story"
              : "Read story"
            : planet.id === 9
              ? readingMissionStarted
                ? "Return to assessment"
                : "Start assessment"
              : readingMissionStarted
                ? "Return to mission"
                : "Start mission",
          () => {
            setProgress((current) => ({
              ...current,
              startedMissions: {
                ...current.startedMissions,
                [planet.id]: true,
              },
            }));

            if (planet.id === 9) {
              startPlutoAssessment();
            } else {
              setBuiltSentence(
                []
              );

              setBuiltWord([]);

              setFeedback(
                ""
              );

              setIsProcessing(
                false
              );

              setRevealedAnswer(
                ""
              );

              setScreen(
                "mission"
              );
            }
          }
        )}
      </main>
    );
  } else if (
    screen === "mission"
  ) {
    const journeyPercent =
      (progress.question /
        missionQuestions.length) *
      100;

    content = (
      <main className="mission-panel">
        <LocalBackButton
          className="page-back-button"
          label="Planet"
          onClick={() => setScreen("planet")}
        />
        <div className="mission-status">
          <button
            className="text-button"
            onClick={() =>
              setScreen("planet")
            }
            type="button"
          >
            ← Planet
          </button>

          <span>
            {planet.name} ·{" "}
            {planet.id === 8
              ? "Page"
              : planet.id === 9
                ? "Question"
                : "Star"}{" "}
            {progress.question +
              1}{" "}
            of{" "}
            {missionQuestions.length}
          </span>
        </div>

        <div
          className="journey-track"
          aria-label={`Currently on ${planet.name}. ${progress.question} questions completed.`}
        >
          <PlanetVisual
            planet={planet}
            className="journey-planet planet-art"
          />

          <div className="journey-line">
            <b
              className="journey-rocket"
              style={{
                left: `${journeyPercent}%`,
              }}
            >
              🚀
            </b>
          </div>
        </div>

        {planet.id === 8 ? (
          <>
            <p className="eyebrow">
              ATLI AND THE LOST MAP
            </p>

            <div className="story-book">
              <div
                className="story-page"
                style={{
                  minHeight:
                    "540px",
                  display: "flex",
                  flexDirection:
                    "column",
                }}
              >
                <div className="story-page-number">
                  Page{" "}
                  {progress.question +
                    1}{" "}
                  of{" "}
                  {missionQuestions.length}
                </div>

                <div
                  className="story-image-container"
                  style={{
                    width: "100%",
                    height: "300px",
                    margin:
                      "0 auto 14px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <img
                    src={
                      question.image
                    }
                    alt=""
                    className="story-image"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit:
                        "contain",
                    }}
                  />
                </div>

                <div
                  className="story-text"
                  style={{
                    minHeight:
                      "85px",
                    display: "flex",
                    flexDirection:
                      "column",
                    justifyContent:
                      "center",
                  }}
                >
                  {question.text.map(
                    (
                      line,
                      index
                    ) => (
                      <p key={index}>
                        {line}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="story-controls">
              <button
                className="secondary-button story-button"
                onClick={
                  previousStoryPage
                }
                disabled={
                  progress.question ===
                  0
                }
                type="button"
              >
                ← Back
              </button>

              <button
                className="primary-button story-button"
                onClick={
                  nextStoryPage
                }
                type="button"
              >
                {progress.question ===
                missionQuestions.length -
                  1
                  ? "Finish Book 🚀"
                  : "Next Page →"}
              </button>
            </div>
          </>
        ) : planet.id === 5 ||
          question.type ===
            "reading" ? (
          <>
            <p className="eyebrow">
              WHAT IS THIS?
            </p>

            <div className="reading-image-container">
              {!questionImageLoaded && (
                <div
                  className="reading-image-loading"
                  role="status"
                  aria-live="polite"
                >
                  Loading picture…
                </div>
              )}

              <img
                key={question.image}
                src={
                  question.image
                }
                alt="Picture clue"
                className={`reading-image ${
                  questionImageLoaded ? "loaded" : "loading"
                }`}
                loading="eager"
                decoding="async"
                onLoad={() => setLoadedQuestionImage(question.image)}
                onError={() => setLoadedQuestionImage(question.image)}
              />
            </div>

            <div className="answer-grid">
              {options.map(
                (word) => (
                  <button
                    key={word}
                    className="word-button"
                    onClick={() =>
                      answer(word)
                    }
                    disabled={
                      isProcessing ||
                      !questionImageLoaded
                    }
                    type="button"
                  >
                    {word}
                  </button>
                )
              )}
            </div>
          </>
        ) : planet.id === 6 ||
          question.type ===
            "missing" ? (
          <>
            <p className="eyebrow">
              FILL IN THE MISSING LETTER
            </p>

            <div className="missing-word-target">
              {revealedAnswer
                ? question.word
                : question.display}
            </div>

            <div className="answer-grid">
              {options.map(
                (letter) => (
                  <button
                    key={letter}
                    className="letter-button"
                    onClick={() =>
                      answer(letter)
                    }
                    disabled={
                      isProcessing
                    }
                    type="button"
                  >
                    {letter}
                  </button>
                )
              )}
            </div>
          </>
        ) : planet.id === 7 ||
          question.type ===
            "sentences" ? (
          <>
            <p className="eyebrow">
              BUILD THE SENTENCE
            </p>

            <div
              className="sentence-target"
              aria-live="polite"
            >
              {builtSentence.length >
              0 ? (
                <>
                  {builtSentence.map(
                    (
                      word,
                      index
                    ) => (
                      <button
                        key={`${word}-${index}`}
                        className="sentence-word"
                        onClick={() =>
                          removeSentenceWord(
                            index
                          )
                        }
                        disabled={
                          isProcessing
                        }
                        aria-label={`Remove ${word}`}
                        type="button"
                      >
                        {word}
                      </button>
                    )
                  )}

                  <span className="sentence-hint">
                    Tap a word to remove
                    it.
                  </span>
                </>
              ) : (
                <span className="sentence-placeholder">
                  Tap the words in the
                  right order
                </span>
              )}
            </div>

            <div className="answer-grid sentence-options">
              {options.map(
                (
                  word,
                  index
                ) => (
                  <button
                    key={`${word}-${index}`}
                    className="word-button"
                    onClick={() =>
                      selectSentenceWord(
                        word
                      )
                    }
                    disabled={
                      isProcessing ||
                      builtSentence.includes(
                        word
                      )
                    }
                    type="button"
                  >
                    {word}
                  </button>
                )
              )}
            </div>
          </>
        ) : planet.id === 4 ||
          question.type === "word-order" ? (
          <>
            <p className="eyebrow">
              LISTEN TO THE WORD AND PUT IT IN THE RIGHT ORDER
            </p>

            <button
              className="sound-target"
              type="button"
              onClick={() =>
                speak(question.word)
              }
              disabled={!soundOn}
            >
              🔊 Hear the word
            </button>

            <div
              className="sentence-target"
              aria-live="polite"
            >
              {builtWord.length >
              0 ? (
                builtWord.map(
                  (
                    item,
                    index
                  ) => (
                    <span
                      key={`${item.index}-${index}`}
                      className="sentence-word"
                    >
                      {
                        item.letter
                      }
                    </span>
                  )
                )
              ) : (
                <span className="sentence-placeholder">
                  Tap the letters in the right order
                </span>
              )}
            </div>

            <div className="answer-grid">
              {wordOrderOptions.map(
                (item) => (
                  <button
                    key={item.index}
                    className="letter-button"
                    onClick={() =>
                      selectWordOrderLetter(
                        item.index
                      )
                    }
                    disabled={
                      isProcessing ||
                      builtWord.some(
                        (
                          selected
                        ) =>
                          selected.index ===
                          item.index
                      )
                    }
                    type="button"
                  >
                    {item.letter}
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">
              FIND THE LETTER
            </p>

            <div className="target-letter">
              {question.target}
            </div>

            <div className="answer-grid">
              {options.map(
                (letter) => (
                  <button
                    key={letter}
                    className="letter-button"
                    onClick={() =>
                      answer(letter)
                    }
                    disabled={
                      isProcessing
                    }
                    type="button"
                  >
                    {letter}
                  </button>
                )
              )}
            </div>
          </>
        )}

        <p
          className="feedback"
          aria-live="polite"
        >
          {feedback}
        </p>
      </main>
    );
  } else if (
    screen === "celebration"
  ) {
    const celebrationDescription =
      planet.id === 8
        ? "You finished Atli and the Lost Map!"
        : planet.id === 9
          ? "You finished the final Pluto assessment!"
          : `You completed your reading mission on ${planet.name}.`;

    const celebrationSubject =
      planet.id === 8
        ? "READING"
        : planet.id === 9
          ? "FINAL ASSESSMENT"
          : "READING";

    content = (
      <main className="celebration-panel">
        <LocalBackButton
          className="page-back-button"
          label="Reading map"
          onClick={() => setScreen("map")}
        />
        <p className="eyebrow">
          MISSION COMPLETE
        </p>

        <h1>
          Mission accomplished!
        </h1>

        <p className="celebration-message">
          {
            celebrationDescription
          }
        </p>

        <PlanetVisual
          planet={planet}
          className="celebration-planet planet-art"
        />

        <p className="celebration-subject">
          {celebrationSubject}
        </p>

        <p className="celebration-description">
          {planet.description}
        </p>

        <div className="celebration-actions">
          {planet.id === 9
            ? action(
                "See Parent Results →",
                () =>
                  setScreen(
                    "results"
                  )
              )
            : planet.id <
                planets.length
              ? action(
                  "Unlock next planet →",
                  unlockNext
                )
              : action(
                  "Back to planet map",
                  () =>
                    setScreen(
                      "map"
                    ),
                  "secondary-button"
                )}
        </div>
      </main>
    );
  } else if (
    screen === "results"
  ) {
    const resultEntries =
      plutoSkills.map(
        (skill) => {
          const result =
            assessmentResults?.[
              skill.id
            ] || {
              correct: 0,
              total: 4,
            };

          const percentage =
            Math.round(
              (result.correct /
                result.total) *
                100
            );

          const status =
            percentage >= 90
              ? "Strong"
              : percentage >= 70
                ? "Developing"
                : "Keep Practicing";

          return {
            ...skill,
            ...result,
            percentage,
            status,
          };
        }
      );

    const overallCorrect =
      resultEntries.reduce(
        (
          total,
          result
        ) =>
          total +
          result.correct,
        0
      );

    const overallTotal =
      resultEntries.reduce(
        (
          total,
          result
        ) =>
          total +
          result.total,
        0
      );

    const doingWell =
      resultEntries.filter(
        (result) =>
          result.percentage >= 70
      );

    const keepPracticing =
      resultEntries.filter(
        (result) =>
          result.percentage < 70
      );

    content = (
      <main className="page results-page">
        <p className="eyebrow">
          Oatle kids Reading Adventures
        </p>

        <h1>
          Parent Results
        </h1>

        <p className="page-intro">
          Results from the final Pluto
          assessment in Reading Adventures.
        </p>

        <div className="result-summary">
          <h2>
            Overall score
          </h2>

          <strong>
            {overallCorrect}/
            {overallTotal}
          </strong>

          <span>
            {Math.round(
              (overallCorrect /
                overallTotal) *
                100
            )}
            %
          </span>
        </div>

        <div className="result-list">
          {resultEntries.map(
            (result) => (
              <div
                className="result-row"
                key={result.id}
              >
                <strong>
                  {result.name}
                </strong>

                <span>
                  {result.correct}/
                  {result.total}
                </span>

                <span>
                  {result.percentage}%
                </span>

                <span>
                  {result.status}
                </span>
              </div>
            )
          )}
        </div>

        <div className="result-columns">
          <section>
            <h2>
              Doing well
            </h2>

            <p>
              {doingWell.length >
              0
                ? doingWell
                    .map(
                      (
                        result
                      ) =>
                        result.name
                    )
                    .join(", ")
                : "Keep exploring each skill."}
            </p>
          </section>

          <section>
            <h2>
              Keep practicing
            </h2>

            <p>
              {keepPracticing.length >
              0
                ? keepPracticing
                    .map(
                      (
                        result
                      ) =>
                        result.name
                    )
                    .join(", ")
                : "No skills to list."}
            </p>
          </section>
        </div>

        {action(
          "Return home",
          () =>
            setScreen("home"),
          "secondary-button"
        )}
      </main>
    );
    } else if (screen === "betaFeedback") {
    content = (
      <BetaFeedback
        user={user}
        onBack={() => setScreen("settings")}
      />
    );
  } else {
    content = (
      <main className="settings-panel">
        <p className="eyebrow">
          MISSION CONTROL
        </p>

        <h1>
          Settings
        </h1>

        <section
          className="child-profile-settings"
          aria-labelledby="child-profile-title"
        >
          <h2 id="child-profile-title">
            Child Profile
          </h2>

          <p className="page-intro">
            Add a few details about the child. These are used to personalize writing adventures.
          </p>

          <label className="profile-field">
            <span>
              What is your name?
            </span>

            <input
              type="text"
              value={
                childProfile.name
              }
              onChange={(event) =>
                setChildProfile(
                  (current) => ({
                    ...current,
                    name: event.target.value,
                  })
                )
              }
              autoComplete="off"
            />
          </label>

          <label className="profile-field">
            <span>
              How old are you?
            </span>

            <input
              type="number"
              min="0"
              max="18"
              inputMode="numeric"
              value={
                childProfile.age
              }
              onChange={(event) =>
                setChildProfile(
                  (current) => ({
                    ...current,
                    age: event.target.value,
                  })
                )
              }
            />
          </label>

          <label className="profile-field">
            <span>
              What is your favourite colour?
            </span>

            <input
              type="text"
              value={
                childProfile.favouriteColour
              }
              onChange={(event) =>
                setChildProfile(
                  (current) => ({
                    ...current,
                    favouriteColour:
                      event.target.value,
                  })
                )
              }
              autoComplete="off"
            />
          </label>

          <label className="profile-field">
            <span>
              How many siblings do you have?
            </span>

            <input
              type="number"
              min="0"
              max="20"
              inputMode="numeric"
              value={
                childProfile.siblings
              }
              onChange={(event) =>
                setChildProfile(
                  (current) => ({
                    ...current,
                    siblings:
                      event.target.value,
                  })
                )
              }
            />
          </label>
        </section>

        <button
          className="setting-row beta-feedback-setting"
          onClick={() => setScreen("betaFeedback")}
          type="button"
        >
          <span>
            <strong>Today's Feedback</strong>
            <small>
              Share your experience with today's activities
            </small>
          </span>

          <span aria-hidden="true">→</span>
        </button>

        <label className="setting-row">
          Sound effects and spoken
          prompts

          <button
            className="toggle"
            aria-pressed={soundOn}
            onClick={() =>
              setSoundOn(
                (on) => !on
              )
            }
            type="button"
          >
            {soundOn
              ? "On"
              : "Off"}
          </button>
        </label>

        <button
          className="danger-button"
          onClick={
            resetProgress
          }
          type="button"
        >
          Reset game progress
        </button>

        <button
          className="secondary-button"
          onClick={() => {
            localStorage.removeItem("oatle-age-group");
            setAgeGroup(null);
            setScreen("ageSelect");
          }}
          type="button"
        >
          Change child age group
        </button>

        <button
          className="secondary-button"
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setHasAccess(false);
            localStorage.removeItem("oatle-age-group");
            setAgeGroup(null);
            setScreen("home");
          }}
          type="button"
        >
          Log out
        </button>
      </main>
    );
  }

  const showBottomNav =
    user && hasAccess && ageGroup && screen !== "scribbler";

  return (
    <div className={`app ${showBottomNav ? "app-with-bottom-nav" : ""}`}>
      {content}

      {showBottomNav && (
          <AppNav
            onHome={() =>
              setScreen(ageGroup === "little" ? "littleExplorers" : "home")
            }
            onExplore={() =>
              setScreen(ageGroup === "little" ? "littleExplorers" : "explore")
            }
            onSettings={() =>
              setScreen("settings")
            }
            activeScreen={screen}
          />
        )}
    </div>
  );
}

export default App;
