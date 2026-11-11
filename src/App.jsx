import { promoErrorMessage } from './lib/promoErrors';
import { SUBSCRIPTION_PLANS } from './lib/subscriptionPlans';
import { learningStorage } from './lib/profileStorage.js';
import { readSavedActivity, saveActivity, resumeScreen } from './utils/savedActivity';
import EmailPreferences from './components/EmailPreferences';
import ReportDelivery from './components/ReportDelivery';
import { attemptId, queueReport } from './lib/parentEmail';
import { submitPayfastCheckout } from './lib/payfastCheckout';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import AgeSelection from "./components/AgeSelection";
import WritingProfileReminder from "./components/WritingProfileReminder";
import { missingWritingProfileFields } from "./utils/writingProfile";

import { questions } from "./data/questions";
import { lowercaseQuestions } from "./data/lowercaseQuestions";
import {
  createMatchingQuestions,
  matchingQuestions,
} from "./data/matchingQuestions";
import { wordOrderQuestions } from "./data/wordOrderQuestions";
import { readingQuestions } from "./data/readingQuestions";
import { sentenceQuestions } from "./data/sentenceQuestions";
import { missingLettersQuestions } from "./data/missingLettersQuestions";
import {
  assessmentQuestions as plutoQuestionPool,
  assessmentSkills as plutoSkills,
} from "./data/assessmentQuestions";
import { getReadingSpeechText } from "./utils/readingSpeech";
import { preloadImages } from "./utils/preloadImages";
import { speak, stopSpeech } from "./utils/speech";
import { hasActiveEntitlement } from "./lib/accessPolicy";
import LoginPage from "./components/LoginPage";
import PasswordRecovery from "./components/PasswordRecovery";
import { supabase } from "./lib/supabase";

import { selectAssessment, restoreAssessmentQuestions } from "./utils/assessmentSelection";
import { generateOptions } from "./utils/generateOptions";
import { generateReadingOptions } from "./utils/generateReadingOptions";
import { generateSentenceOptions } from "./utils/generateSentenceOptions";
import { generateMissingLettersOptions } from "./utils/generateMissingLettersOptions";

import MathSection from "./components/MathSection";
import { BigMusicAdventure } from './components/MusicStudio';
import Scribbler from "./components/Scribbler";
import ColoringBook from "./components/ColoringBook";
import FeelingsAdventure from "./components/FeelingsAdventure";
import AlphabetTracingMission from "./components/AlphabetTracingMission";
import NumberTracingMission from "./components/NumberTracingMission";
import ShapeTracingMission from "./components/ShapeTracingMission";
import SentenceWritingMission from "./components/SentenceWritingMission";
import { migrateWritingProgress } from "./data/wordWriting";
import LocalBackButton from "./components/LocalBackButton";
import WelcomeScreen from "./components/WelcomeScreen";
import LittleExplorers from "./components/LittleExplorers";
import CosmicPuzzles from "./components/CosmicPuzzles";
import ReadingBalloonBreak from "./components/ReadingBalloonBreak";
import AdventureWorlds from "./components/AdventureWorlds";
import BigKidsPlanetJourney from "./components/BigKidsPlanetJourney";
import { adventureEntryScreen } from "./components/bigKidsHomes";
import { beginMissionRun, finishMissionRun } from "./utils/missionReplay";
import StorybookAdventure from "./components/StorybookAdventure";
import SpaceBuilder from "./components/SpaceBuilder";

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
        learningStorage.getItem("atli-space-assessment-results")
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
      learningStorage.getItem(READING_ASSESSMENT_ATTEMPT_KEY)
    );

    const questions = restoreAssessmentQuestions(saved?.questionIds, plutoQuestionPool);
    const valid = questions.length === plutoSkills.length * 4;
    return {
      active: Boolean(saved?.active) && valid,
      questions,
      answered: valid ? Math.min(Math.max(0, saved?.answered || 0), questions.length) : 0,
      scores: valid ? saved?.scores || emptyPlutoResults() : emptyPlutoResults(),
    };
  } catch {
    return {
      active: false, questions: [], answered: 0,
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

const READING_BREAK_INTERVAL = 6;

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
      learningStorage.getItem("atli-space-progress")
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
    return migrateWritingProgress(JSON.parse(learningStorage.getItem("atli-writing-progress")));
  } catch {
    return migrateWritingProgress(null);
  }
};

const EMPTY_CHILD_PROFILE = {
  name: "",
  age: "",
  favouriteColour: "",
  siblings: "",
};

const savedChildProfile = () => {
  try {
    return (
      JSON.parse(
        learningStorage.getItem("oatle-child-profile")
      ) || { ...EMPTY_CHILD_PROFILE }
    );
  } catch {
    return { ...EMPTY_CHILD_PROFILE };
  }
};

const savedAgeGroup = () => {
  const saved = learningStorage.getItem("oatle-age-group");
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
    description: "Write ten simple words",
    mission: "writingMission4",
  },
  {
    id: 5,
    name: "Jupiter",
    image: jupiterImage,
    color: "#D6B44C",
    description: "Write simple sentences",
    mission: "writingMission5",
  },
];

/*
 * Spoken guidance for reading missions. Questions and instructions
 * are narrated, while assessment answers stay silent until the child
 * has made a choice.
 */

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

function AppNav({
  onHome,
  onExplore,
  onSettings,
  activeScreen,
  childName,
}) {
  const items = [
    {
      label: "Home",
      action: onHome,
      icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      active: activeScreen === "ageSelect",
    },
    {
      label: "Adventures",
      action: onExplore,
      icon: <PlanetIcon />,
      active:
        activeScreen === "explore" ||
        activeScreen === "map" ||
        activeScreen === "planet" ||
        activeScreen === "mission" ||
        activeScreen === "math" ||
        activeScreen === "cosmicPuzzles" ||
        activeScreen === "spaceBuilder" ||
        activeScreen === "storybooks" ||
        activeScreen === "writing" ||
        activeScreen === "writingMap" ||
        activeScreen === "writingPlanet" ||
        activeScreen === "writingCelebration" ||
        activeScreen === "scribbler" ||
        activeScreen === "coloringBook" ||
        activeScreen === "feelings" ||
        activeScreen === "writingMission1" ||
        activeScreen === "writingMission2" ||
        activeScreen === "writingMission3" ||
        activeScreen === "writingMission4" ||
        activeScreen === "writingMission5" ||
        activeScreen === "littleExplorers",
    },
    {
      label: "Settings",
      action: onSettings,
      icon: childName ? <span className="child-avatar" aria-hidden="true">{Array.from(childName)[0].toLocaleUpperCase()}</span> : <SettingsIcon />,
      childName,
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
          aria-label={item.childName ? `Settings for ${item.childName}` : item.label}
          aria-current={
            item.active ? "page" : undefined
          }
        >
          <span className="bottom-nav-icon">
            {item.icon}
          </span>

          <span className="bottom-nav-label">
            {item.childName && <><span className="bottom-nav-child-name">{item.childName}</span><span aria-hidden="true"> · </span></>}
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

function App({ onParentAccount, onBeforeSignOut, onAccessChanged, onRecoveryDone, profileNickname = '', startInSettings = false, sessionUser } = {}) {
  const [passwordRecovery, setPasswordRecovery] = useState(() =>
    new URLSearchParams(window.location.search).get("reset") === "1" ||
    new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"
  );
  // The household has already resolved the session. Only password recovery
  // runs before that gate and needs its own auth subscription.
  const [recoveryUser, setRecoveryUser] = useState(null);
  const [recoveryAuthLoading, setRecoveryAuthLoading] = useState(true);
  const user = sessionUser === undefined ? recoveryUser : sessionUser;
  const authLoading = sessionUser === undefined && recoveryAuthLoading;

  // Authentication and product access are separate.
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessGrant, setAccessGrant] = useState(null);
  const hasAccess = hasActiveEntitlement(accessGrant, user?.id);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    return payment === 'success' ? 'Payment submitted. Access will update after payment confirmation.' : payment === 'cancelled' ? 'Checkout was cancelled. You have not started a subscription through this checkout.' : '';
  });
  const checkoutFunction = import.meta.env.VITE_PAYFAST_CHECKOUT_FUNCTION || 'quick-service';
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const [progress, setProgress] = useState(savedGame);

  const [writingProgress, setWritingProgress] =
    useState(savedWritingProgress);

  const [writingActivePlanet, setWritingActivePlanet] =
    useState(() => Math.min(writingPlanets.length, Math.max(1, readSavedActivity('oatle-app-location', {}).writingActivePlanet || savedWritingProgress().unlocked || 1)));

  const [writingCelebrationMission, setWritingCelebrationMission] =
    useState(null);

  // Ask once, then open the saved age group's adventures on later visits.
  const [screen, setScreen] = useState(() => {
    if (startInSettings) return 'settings';
    const group = savedAgeGroup();
    const fallback = group === 'little' ? 'littleExplorers' : group === 'big' ? 'explore' : 'ageSelect';
    return group === 'big' ? resumeScreen(readSavedActivity('oatle-app-location', {}),
      ['explore', 'map', 'planet', 'writingMap', 'writingPlanet', 'writingMission1', 'writingMission2', 'writingMission3', 'writingMission4', 'writingMission5', 'coloringBook', 'math'], fallback) : fallback;
  });
  const [ageGroup, setAgeGroup] = useState(savedAgeGroup);
  useEffect(() => {
    saveActivity('oatle-app-location', { screen, writingActivePlanet });
  }, [screen, writingActivePlanet]);

  const [assessmentResults, setAssessmentResults] =
    useState(savedAssessmentResults);

  const [assessmentScores, setAssessmentScores] =
    useState(() => savedReadingAssessmentAttempt().scores);

  const [readingAssessmentActive, setReadingAssessmentActive] =
    useState(() => savedReadingAssessmentAttempt().active);
  const [readingAssessmentQuestions, setReadingAssessmentQuestions] = useState(() => {
    const saved = savedReadingAssessmentAttempt();
    return saved.questions.length ? saved.questions : selectAssessment(plutoQuestionPool, plutoSkills, 4);
  });
  const [readingAssessmentAnswered, setReadingAssessmentAnswered] = useState(() => savedReadingAssessmentAttempt().answered);


  const [soundPreference, setSoundOn] = useState(true);
  const soundOn = soundPreference && hasAccess && !authLoading && !accessLoading;

  const [childProfile, setChildProfile] =
    useState(() => { const saved = savedChildProfile(); return { ...saved, name: saved.name || profileNickname }; });

  const [settingsReturnScreen, setSettingsReturnScreen] = useState(null);
  const missingProfileFields = missingWritingProfileFields(childProfile);
  const writingProfileIncomplete = missingProfileFields.length > 0;
  const openSettings = (returnScreen = null) => {
    setSettingsReturnScreen(returnScreen);
    setScreen("settings");
  };
  const profileReminder = (returnScreen) => <WritingProfileReminder
    missing={missingProfileFields} onSettings={() => openSettings(returnScreen)} />;

  const [feedback, setFeedback] = useState("");
  const [builtSentence, setBuiltSentence] =
    useState([]);
  const [builtWord, setBuiltWord] =
    useState([]);
  const [isProcessing, setIsProcessing] =
    useState(false);
  const [revealedAnswer, setRevealedAnswer] =
    useState("");
  const [readingMissionRun, setReadingMissionRun] =
    useState(0);
  const [completedReadingBreaks, setCompletedReadingBreaks] =
    useState([]);

  const advanceTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(advanceTimer.current), [screen]);
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
    if (sessionUser !== undefined) return;
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
        setRecoveryUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          setAccessGrant(null);
        }

        setRecoveryAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sessionUser]);

  useEffect(() => {
    let mounted = true;
    let requestSequence = 0;
    const userId = user?.id;
    const checkAccess = async () => {
      const request = ++requestSequence;
      if (!userId) {
        if (mounted) setAccessLoading(false);
        return;
      }
      try {
        const { data, error, status } = await supabase.from("entitlements")
          .select("user_id, status, expires_at").eq("user_id", userId).maybeSingle();
        if (!mounted || request !== requestSequence) return;
        if (!error) setAccessGrant(data);
        else if (status > 0 && status < 500 && status !== 408 && status !== 429) setAccessGrant(null);
      } catch {
        // Keep the last verified grant during a connection failure. Its expiry still applies.
      } finally {
        if (mounted && request === requestSequence) setAccessLoading(false);
      }
    };
    void checkAccess();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void checkAccess();
    };
    const refreshTimer = window.setInterval(() => { void checkAccess(); }, 30000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("online", checkAccess);
    return () => {
      mounted = false;
      requestSequence += 1;
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("online", checkAccess);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!hasAccess || accessGrant.expires_at === null) return undefined;
    // Keep expiry checks within the browser timer limit, including long grants.
    const timer = window.setTimeout(() => {
      setAccessGrant(current => hasActiveEntitlement(current, user?.id) ? { ...current } : null);
    }, Math.min(Date.parse(accessGrant.expires_at) - Date.now() + 1, 2147483647));
    return () => window.clearTimeout(timer);
  }, [accessGrant, hasAccess, user?.id]);

  const planet =
    planets.find(
      (item) => item.id === progress.activePlanet
    ) || planets[0];

  const missionQuestions = useMemo(
    () => {
      // Starting Earth again creates a fresh 26-letter case mix.
      void readingMissionRun;

      return planet.id === 8
        ? planet.questions
        : planet.id === 9
          ? readingAssessmentQuestions
          : planet.id === 3
            ? shuffleArray(createMatchingQuestions())
            : shuffleArray(planet.questions);
    },
    [planet.id, planet.questions, readingMissionRun, readingAssessmentQuestions]
  );

  const question =
    missionQuestions[progress.question] ||
    missionQuestions[0];

  const readingBreakKey = `${planet.id}-${progress.question}`;
  const readingBreakDue =
    screen === "mission" &&
    planet.id >= 1 &&
    planet.id <= 7 &&
    progress.question > 0 &&
    progress.question % READING_BREAK_INTERVAL === 0 &&
    !completedReadingBreaks.includes(readingBreakKey);

  const [loadedQuestionImage, setLoadedQuestionImage] =
    useState(null);

  const questionImageLoaded =
    !question?.image || loadedQuestionImage === question.image;

  useEffect(() => {
    if (screen !== "mission" && screen !== "planet") return;
    preloadImages(missionQuestions.slice(progress.question, progress.question + 3).map(item => item.image));
  }, [missionQuestions, progress.question, screen]);

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
    if (!question || (planet.id !== 4 && question.type !== "word-order")) {
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

    learningStorage.setItem(
      "atli-space-progress",
      JSON.stringify(savedProgress)
    );
  }, [progress]);

  useEffect(() => {
    learningStorage.setItem(
      "atli-writing-progress",
      JSON.stringify(writingProgress)
    );
  }, [writingProgress]);

  useEffect(() => {
    learningStorage.setItem(
      "oatle-child-profile",
      JSON.stringify(childProfile)
    );
  }, [childProfile]);

  useEffect(() => {
    if (assessmentResults) {
      learningStorage.setItem(
        "atli-space-assessment-results",
        JSON.stringify(assessmentResults)
      );
    }
  }, [assessmentResults]);

  useEffect(() => {
    learningStorage.setItem(
      READING_ASSESSMENT_ATTEMPT_KEY,
      JSON.stringify({
        active: readingAssessmentActive,
        scores: assessmentScores,
        questionIds: readingAssessmentQuestions.map(q => q.assessmentId),
        answered: readingAssessmentAnswered,
      })
    );
  }, [assessmentScores, readingAssessmentActive, readingAssessmentQuestions, readingAssessmentAnswered]);

  /*
   * Central reading speech.
   *
   * Mars uses whole-word TTS. Neptune reads each story page aloud.
   * Assessment tasks are narrated without speaking their answers.
   */
  useEffect(() => {
    if (
      !soundOn ||
      screen !== "mission" ||
      !question
    ) {
      return;
    }

    if (readingBreakDue) {
      const timer = setTimeout(() => {
        speak("Pop the balloons for a mini break! Then keep exploring.");
      }, 250);

      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    }

    const isWordOrder =
      planet.id === 4 || question.type === "word-order";

    if (isWordOrder) {
      const timer = setTimeout(() => {
        speak("Listen to the word and put it in the right order.");
      }, 250);

      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    }

    const speechText = getReadingSpeechText(
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
    readingBreakDue,
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

    const prompts = {
      map: "Choose a planet for your next reading mission.",
      planet: `Welcome to planet ${planet.name}. ${planet.description}.`,
      celebration: `Mission accomplished! You completed your mission on ${planet.name}.`,
      writingMap:
        "Choose a writing planet, or open the Scribbler to draw freely.",
      writingPlanet: `Welcome to planet ${selectedWritingPlanet.name}. ${selectedWritingPlanet.description}.`,
      writingCelebration: `Mission accomplished! You completed your writing mission on ${completedWritingPlanet.name}.`,
      scribbler:
        "Welcome to the Scribbler. You can turn your device sideways for more space. You can also keep it upright. Draw, write, erase, and add stickers to your picture.",
    };

    const needsProfileReminder = writingProfileIncomplete && (screen === "writingMap" || screen === "writingMission5" || (screen === "writingPlanet" && selectedWritingPlanet.id === 5));
    const profilePrompt = "Before Sentence Writing, ask a grown-up to open Settings and add your nickname, age, favourite colour and number of siblings.";
    const prompt = needsProfileReminder ? `${prompts[screen] || "Sentence Writing."} ${profilePrompt}` : prompts[screen];
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
    planet.description,
    planet.name,
    screen,
    soundOn,
    writingActivePlanet,
    writingCelebrationMission,
    writingProfileIncomplete,
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

  const completeReadingBreak = () => {
    setCompletedReadingBreaks(current =>
      current.includes(readingBreakKey) ? current : [...current, readingBreakKey]
    );
  };

  const celebrateReadingMission = () => {
    setProgress(current => finishMissionRun(current, planet.id));
    setScreen("celebration");
  };

  const goToPlanet = (id) => {
    setProgress((current) => {
      const saved = savedGame();
      const missions = {
        ...saved.missions,
        ...current.missions,
        [current.activePlanet]: current.question,
      };

      const run = id === 9 ? { ...current, missions } : beginMissionRun({ ...current, missions }, id);
      return { ...run, activePlanet: id, question: run.missions[id] || 0 };
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
      attemptId("reading", true);
      setReadingAssessmentQuestions(selectAssessment(plutoQuestionPool, plutoSkills, 4, savedAttempt.questions.map(q => q.assessmentId)));
      setReadingAssessmentAnswered(0);
      setAssessmentScores(emptyPlutoResults());
      setReadingAssessmentActive(true);
    } else {
      setReadingAssessmentQuestions(savedAttempt.questions);
      setReadingAssessmentAnswered(savedAttempt.answered);
      setAssessmentScores(savedAttempt.scores);
      if (savedAttempt.answered === savedAttempt.questions.length) {
        finishPlutoAssessment(savedAttempt.scores);
        return;
      }
    }

    setProgress((current) => ({
      ...current,
      question: savedAttempt.active
        ? savedAttempt.answered
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
    setReadingAssessmentAnswered(progress.question + 1);

    return nextScores;
  };

  const finishPlutoAssessment = (scores) => {
    queueReport(user.id, "reading", scores);
    setAssessmentResults(scores);
    setReadingAssessmentActive(false);
    celebrateReadingMission();
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

    celebrateReadingMission();
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
        celebrateReadingMission();
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

      celebrateReadingMission();

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
          celebrateReadingMission();
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
        celebrateReadingMission();
      }

      setIsProcessing(false);
    }, 1100);
  };

  const completeWritingMission = (
    missionId
  ) => {
    setWritingProgress((current) => ({
      ...finishMissionRun(current, missionId),
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

    setWritingProgress(current => beginMissionRun(current, planetId));
    setWritingActivePlanet(planetId);

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

    setWritingProgress(current => ({
      ...beginMissionRun(current, nextPlanetId),
      unlocked: Math.max(current.unlocked, nextPlanetId),
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

    setProgress(current => {
      const run = nextPlanetId === 9 ? current : beginMissionRun(current, nextPlanetId);
      return { ...run, unlocked: Math.max(current.unlocked, nextPlanetId), activePlanet: nextPlanetId, question: run.missions?.[nextPlanetId] || 0 };
    });

    setScreen(
      unlockedPlanet
        ? "planet"
        : "map"
    );
  };

  const resetProgress = () => {
    for (const key of ['oatle-app-location', 'oatle-maths-location', 'oatle-little-location', 'oatle-colouring-little', 'oatle-colouring-big', 'oatle-block-build-little', 'oatle-block-build-big']) {
      try { learningStorage.removeItem(key); } catch { /* Storage unavailable. */ }
    }
    setProgress({
      unlocked: 1,
      activePlanet: 1,
      question: 0,
      missions: {},
      startedMissions: {},
    });

    setWritingProgress(migrateWritingProgress(null));

    setWritingActivePlanet(1);
    setWritingCelebrationMission(null);
    learningStorage.removeItem("oatle-little-explorers-progress");
    learningStorage.removeItem("oatle-little-explorers-started");
    learningStorage.removeItem("oatle-balloon-learning-session");

    setScreen(ageGroup === "little" ? "littleExplorers" : "explore");
  };

  const selectAgeGroup = (group) => {
    learningStorage.setItem("oatle-age-group", group);
    setAgeGroup(group);
    setScreen(group === "little" ? "littleExplorers" : "explore");
  };

  const startSubscription = async (planId = 'single') => {
    if (!checkoutFunction || checkoutLoading) return;
    setCheckoutLoading(true); setCheckoutMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please log in again to subscribe.');
      const { data, error } = await supabase.functions.invoke(checkoutFunction, {
        body: { plan_id: planId }, headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw new Error('Checkout could not start. Please try again shortly.');
      if (data?.error) throw new Error(data.error);
      await submitPayfastCheckout(data, planId);
    } catch (error) {
      setCheckoutMessage(error?.message || 'Checkout could not start. Please try again.');
    } finally { setCheckoutLoading(false); }
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
        throw Object.assign(new Error("Session expired"), { code: "session_expired" });
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

      if (error || !data?.success) {
        setPromoMessage(await promoErrorMessage(error, data));
        return;
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
        .select("user_id, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      setAccessGrant(accessError ? null : entitlement);

      setAccessLoading(false);
      onAccessChanged?.();
    } catch (error) {
      console.error(
        "Promo redemption error:",
        error
      );

      setPromoMessage(await promoErrorMessage(error));

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

  if (authLoading || (user && accessLoading && !passwordRecovery)) {
    content = <WelcomeScreen />;
  } else if (passwordRecovery) {
    content = <PasswordRecovery user={user} onDone={() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      url.hash = "";
      window.history.replaceState(null, "", url.pathname + url.search);
      setPasswordRecovery(false);
      onRecoveryDone?.();
    }} />;
  } else if (!user) {
    content = (
      <LoginPage
        onLogin={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('auth');
          window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        }}
      />
    );
  } else if (!hasAccess) {
    content = (
      <main className="login-page">
        <div className="login-card">
          <p className="eyebrow">
            OATLE KIDS
          </p>

          <h1>
            Choose your access
          </h1>

          <p className="login-intro">
            Your parent account is ready. Choose a monthly subscription or enter your promo code to start exploring.
          </p>

          <div className="subscription-options" aria-label="Subscription plans">
            {Object.values(SUBSCRIPTION_PLANS).map(plan => <section key={plan.id} className="subscription-option">
              <h2>{plan.name} · R{plan.price}/month</h2>
              <p>{plan.profiles === 1 ? '1 child profile · 1 child playing at a time' : 'Up to 3 child profiles · 2 children playing at once'}<br />2 registered devices · Separate saved progress for each child</p>
              <button className="primary-button" disabled={!checkoutFunction || checkoutLoading} onClick={() => startSubscription(plan.id)} type="button">
                {checkoutLoading ? 'Opening secure checkout…' : `Choose ${plan.name} — R${plan.price}/month`}
              </button>
            </section>)}
          </div>
          <p className="login-intro">Your promo code includes the plan stated in your invitation. Family access supports up to three child profiles and two children playing at a time.</p>

          {checkoutMessage && <p className="login-intro" role="status">{checkoutMessage}</p>}
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

          <EmailPreferences />
          <button
            className="secondary-button"
            onClick={async () => {
              await onBeforeSignOut?.();
              await supabase.auth.signOut({ scope: 'local' });
            }}
            type="button"
          >
            Return to login
          </button>
        </div>
      </main>
    );
  } else if (!ageGroup || screen === "ageSelect") {
    content = <AgeSelection onSelect={selectAgeGroup} />;
  } else if (
    screen === "explore"
  ) {
    content = (
      <main className="page adventure-hub expedition-hub big-kids-galaxy">
        <img className="expedition-brand" src="/oatle-kids-wordmark.webp" loading="eager" fetchPriority="high" alt="Oatle Kids" />
        <p className="eyebrow">
          LET'S EXPLORE
        </p>

        <AdventureWorlds soundOn={soundOn} onAdventure={(id) => {
          stopSpeech();
          const nextScreen = adventureEntryScreen(id);
          if (nextScreen) setScreen(nextScreen);
        }} />
      </main>
    );
  } else if (screen === "music") {
    content = <BigMusicAdventure soundOn={soundOn} onBack={() => setScreen("explore")} />;
  } else if (screen === "feelings") {
    content = <FeelingsAdventure ageGroup="big" soundOn={soundOn} onBack={() => setScreen("explore")} />;
  } else if (screen === "storybooks") {
    content = <StorybookAdventure soundOn={soundOn} onBack={() => setScreen("explore")} />;
  } else if (screen === "cosmicPuzzles") {
    content = <CosmicPuzzles onBack={() => setScreen("explore")} soundOn={soundOn} />;
  } else if (screen === "spaceBuilder") {
    content = <SpaceBuilder onBack={() => setScreen("explore")} soundOn={soundOn} />;
  } else if (
    screen === "littleExplorers"
  ) {
    content = (
      <LittleExplorers
        backLabel={ageGroup === "little" ? "Age groups" : "Explore"}
        onBack={() => {
          if (ageGroup === "little") {
            learningStorage.removeItem("oatle-age-group");
            setAgeGroup(null);
            setScreen("ageSelect");
            return;
          }

          setScreen("explore");
        }}
        soundOn={soundOn}
      />
    );
  } else if (screen === "writingMap") {
    content = <BigKidsPlanetJourney title="Writing and Arts" label="Writing planet journey"
      description="Complete each planet to unlock the next writing and arts planet."
      notice={profileReminder("writingMap")}
      currentId={writingActivePlanet} onBack={() => setScreen("explore")}
      childName={childProfile.name} onProfile={() => openSettings()}
      items={[...writingPlanets.map(item => ({ id: item.id, title: item.name, subtitle: item.description, image: item.image, color: item.color,
        locked: item.id > writingProgress.unlocked, complete: Boolean(writingProgress.completedMissions?.[item.id] ?? (item.id < writingProgress.unlocked)),
        onSelect: () => startWritingPlanet(item.id),
      })), { id: "scribbler", title: "Scribbler", subtitle: "Write, draw and explore freely.", image: jupiterImage, color: "#D6B44C", free: true, onSelect: () => setScreen("scribbler") }, { id: "coloring-book", title: "Coloring Book", subtitle: "Scribbler: colour your own picture.", image: venusImage, color: "#C59DEB", free: true, onSelect: () => setScreen("coloringBook") }]} />;
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

        {selectedWritingPlanet.id === 5 && profileReminder("writingPlanet")}
        {(selectedWritingPlanet.id !== 5 || missingProfileFields.length === 0) && action(
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
    screen === "coloringBook"
  ) {
    content = <ColoringBook ageGroup="big" soundOn={soundOn} onBack={() => setScreen("writingMap")} />;
  } else if (
    screen === "scribbler"
  ) {
    content = (
      <Scribbler
        onColoringBook={() => setScreen("coloringBook")}
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
          setScreen("writingMap")
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
          setScreen("writingMap")
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
          setScreen("writingMap")
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
    content = <SentenceWritingMission mode="words" soundOn={soundOn}
      onBack={() => setScreen("writingMap")}
      onComplete={() => completeWritingMission(4)}
      initialStep={writingProgress.missions?.[4] || 0}
      onProgress={step => saveWritingMissionStep(4, step)} />;
  } else if (
    screen === "writingMission5"
  ) {
    content = missingProfileFields.length ? (
      <main className="planet-overview writing-planet-overview">
        <LocalBackButton label="Writing map" onClick={() => setScreen("writingMap")} />
        <h1>Sentence Writing</h1>
        {profileReminder("writingMission5")}
      </main>
    ) : (
      <SentenceWritingMission
        soundOn={soundOn}
        onBack={() =>
          setScreen("writingMap")
        }
        onComplete={() =>
          completeWritingMission(5)
        }
        initialStep={
          writingProgress.missions?.[5] || 0
        }
        onProgress={(step) =>
          saveWritingMissionStep(5, step)
        }
        childProfile={Object.fromEntries(Object.entries(childProfile).map(([key, value]) => [key, String(value ?? "").trim()]))}
      />
    );
  } else if (
    screen === "math"
  ) {
    content = (
      <MathSection
        userId={user.id}
        onHome={() =>
          setScreen("explore")
        }
        onBack={() =>
          setScreen("explore")
        }
        soundOn={soundOn}
        childName={childProfile.name}
        onProfile={() => openSettings()}
      />
    );
  } else if (screen === "map") {
    content = <BigKidsPlanetJourney title="Reading Adventure" label="Reading planet journey"
      description="Complete each planet to unlock the next destination."
      currentId={progress.activePlanet} onBack={() => setScreen("explore")} emblem="Aa"
      childName={childProfile.name} onProfile={() => openSettings()}
      items={planets.map(item => ({
        id: item.id, title: item.name, subtitle: item.description, image: item.image, color: item.color,
        locked: item.id > progress.unlocked, complete: item.id < progress.unlocked || Boolean(progress.completedMissions?.[item.id]) || (item.id === 9 && Boolean(assessmentResults)),
        onSelect: () => goToPlanet(item.id),
      }))} />;
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
              ? readingAssessmentActive
                ? "Return to assessment"
                : assessmentResults ? "Try a new assessment" : "Start assessment"
              : readingMissionStarted
                ? "Return to mission"
                : "Start mission",
          () => {
            if (planet.id === 3 && progress.question === 0) {
              setReadingMissionRun((current) => current + 1);
            }

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
      <main className={`mission-panel ${readingBreakDue ? "has-reading-mini-break" : ""}`}>
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
              <img src="/rocket/oatle-rocket.png" alt="" aria-hidden="true" draggable="false" />
            </b>
          </div>
        </div>

        {readingBreakDue && <ReadingBalloonBreak
          key={readingBreakKey}
          onComplete={completeReadingBreak}
          onPop={() => playSound(correctSound)}
        />}
        <div className={`reading-question-content ${readingBreakDue ? "is-on-break" : ""}`}
          inert={readingBreakDue} aria-hidden={readingBreakDue || undefined}>
        {planet.id !== 4 && question.type !== 'word-order' && <button type="button" className="reading-listen-question" aria-label="Hear the question again" disabled={!soundOn || isProcessing} onClick={() => speak(getReadingSpeechText(planet.id, question))}><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z M15 8q4 4 0 8 M18 5q7 7 0 14" /></svg> Listen</button>}
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
              BUILD THE WORD
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
        </div>
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
          "Back to adventures",
          () =>
            setScreen("explore"),
          "secondary-button"
        )}
      </main>
    );
  } else {
    content = (
      <main className="settings-panel">
        <LocalBackButton label={settingsReturnScreen ? "Writing" : "Adventures"} onClick={() => {
          setScreen(settingsReturnScreen || "explore");
          setSettingsReturnScreen(null);
        }} />
        <p className="eyebrow">
          MISSION CONTROL
        </p>

        <h1>
          Settings
        </h1>

        <EmailPreferences />
        {assessmentResults && action("Parent Results", () => setScreen("results"), "secondary-button")}

        <section
          className="child-profile-settings"
          aria-labelledby="child-profile-title"
        >
          <h2 id="child-profile-title">
            Child Profile
          </h2>

          <p className="page-intro">
            Add only the details needed to personalize writing adventures. Use a nickname rather than a full name. These details are saved privately with this child’s progress in your parent account.
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
              maxLength="24"
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
              maxLength="24"
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
          {settingsReturnScreen && <div className="writing-profile-return" aria-live="polite">
            <p>{missingProfileFields.length ? `Add or check: ${missingProfileFields.join(", ")}.` : "Your child’s details are saved with their profile."}</p>
            <button type="button" className="primary-button" disabled={missingProfileFields.length > 0} onClick={() => {
              setScreen(settingsReturnScreen);
              setSettingsReturnScreen(null);
            }}>Save and return to Writing</button>
          </div>}
        </section>

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

        {onParentAccount && <button className="primary-button" type="button" onClick={onParentAccount}>Manage child profiles, plan and devices</button>}

        <button
          className="danger-button"
          onClick={
            resetProgress
          }
          type="button"
        >
          Reset game progress
        </button>

        <p className="page-intro">Adventure age group: {ageGroup === "little" ? "Ages 2–3" : "Ages 4–7"}</p>

        <button
          className="secondary-button"
          onClick={() => {
            learningStorage.removeItem("oatle-age-group");
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
            await onBeforeSignOut?.();
            await supabase.auth.signOut({ scope: 'local' });
          }}
          type="button"
        >
          Log out
        </button>
      </main>
    );
  }

  const showBottomNav =
    user && hasAccess && ageGroup && screen !== "scribbler" && screen !== "coloringBook" && !screen.startsWith("writingMission");

  return (
    <div className={`app ${showBottomNav ? "app-with-bottom-nav" : ""}`}>
      {user && <ReportDelivery userId={user.id} />}
      {content}

      {showBottomNav && (
          <AppNav
            onHome={() => { stopSpeech(); setScreen("ageSelect"); }}
            onExplore={() =>
              setScreen(ageGroup === "little" ? "littleExplorers" : "explore")
            }
            onSettings={() => openSettings()}
            activeScreen={screen}
            childName={childProfile.name.trim() || profileNickname}
          />
        )}
    </div>
  );
}

export default App;

