import { withCompletedDestination } from "./spaceJourneyLogic";
import BigKidsPlanetJourney from "./BigKidsPlanetJourney";
import { PLANET_NAMES } from "./planetJourneyLayout";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./MathSection.css";
import { colors, shapes } from "../data/mathConstants";
import { mathMissions } from "../data/mathMissions";
import {
  mathAssessmentQuestions,
  assessmentSkills,
} from "../data/mathAssessmentQuestions";
import correctSound from "../sounds/correct.mp3";
import wrongSound from "../sounds/wrong.mp3";
import victorySound from "../sounds/victory.mp3";
import blastoffSound from "../sounds/blastoff.mp3";
import AbacusHelper from "./AbacusHelper";
import GroupingHelper from "./GroupingHelper";
import { speak, stopSpeech } from "../utils/speech";
import LocalBackButton from "./LocalBackButton";

const defaultProgress = {
  unlocked: 1,
  activeMission: 1,
  question: 0,
  assessmentResults: {},
  missions: {},
  startedMissions: {},
};

function stopAudioRef(audioRef) {
  if (!audioRef.current) {
    return;
  }

  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current = null;
}

const MATH_ASSESSMENT_ATTEMPT_KEY =
  "oatle-maths-assessment-attempt";

const readAssessmentAttempt = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(MATH_ASSESSMENT_ATTEMPT_KEY)
    );

    const questionMap = new Map(
      mathAssessmentQuestions.map((question) => [
        question.assessmentId,
        question,
      ])
    );

    return {
      active: Boolean(saved?.active),
      questions: (saved?.questionIds || [])
        .map((id) => questionMap.get(id))
        .filter(Boolean),
      answers: Array.isArray(saved?.answers)
        ? saved.answers
        : [],
    };
  } catch {
    return { active: false, questions: [], answers: [] };
  }
};

function getMissionQuestions(mission) {
  return mission.questionBanks.flat();
}

const readProgress = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("oatle-maths-progress")
    );

    if (!saved) return defaultProgress;

    const savedMission = mathMissions.find(
      (item) => item.id === saved.activeMission
    );

    const lastQuestion = Math.max(
      (savedMission
        ? getMissionQuestions(savedMission).length
        : 1) - 1,
      0
    );

    return {
      ...defaultProgress,
      ...saved,
      question: Math.min(
        saved.question || 0,
        lastQuestion
      ),
    };
  } catch {
    return defaultProgress;
  }
};

const optionColors = {
  red: colors.red,
  yellow: colors.yellow,
  blue: colors.blue,
  green: colors.green,
  orange: colors.orange,
  purple: colors.purple,
  gold: colors.gold,
  lime: colors.lime,
  turquoise: colors.turquoise,
  violet: colors.violet,
  pink: colors.pink,
  maroon: colors.maroon,
  vermilion: "#e34234",
  white: "#ffffff",
};

const countColors = [
  colors.red,
  colors.yellow,
  colors.blue,
  colors.green,
  colors.orange,
  colors.purple,
];

function getItemColor(item) {
  if (!item) return colors.blue;

  if (
    item.color &&
    typeof item.color === "string"
  ) {
    return item.color;
  }

  if (
    item.colorName &&
    optionColors[item.colorName]
  ) {
    return optionColors[item.colorName];
  }

  if (
    typeof item.color === "string" &&
    optionColors[item.color]
  ) {
    return optionColors[item.color];
  }

  return colors.blue;
}

function getItemShape(item) {
  if (!item) return null;

  if (
    item.shape &&
    shapes[item.shape]
  ) {
    return item.shape;
  }

  if (
    typeof item.shape === "string" &&
    shapes[item.shape]
  ) {
    return item.shape;
  }

  return null;
}

function Shape({
  name,
  color = "currentColor",
  className = "",
}) {
  const paths = {
    circle: (
      <circle
        cx="50"
        cy="50"
        r="42"
      />
    ),

    square: (
      <rect
        x="9"
        y="9"
        width="82"
        height="82"
        rx="5"
      />
    ),

    triangle: (
      <polygon points="50,7 94,91 6,91" />
    ),

    rectangle: (
      <rect
        x="5"
        y="22"
        width="90"
        height="56"
        rx="5"
      />
    ),

    oval: (
      <ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="28"
      />
    ),

    diamond: (
      <polygon points="50,5 94,50 50,95 6,50" />
    ),

    star: (
      <polygon points="50,5 61,37 95,37 68,57 78,91 50,71 22,91 32,57 5,37 39,37" />
    ),

    heart: (
      <path d="M50 88 13 51C-7 31 7 7 29 8c10 0 17 5 21 13 4-8 11-13 21-13 22-1 36 23 16 43Z" />
    ),

    pentagon: (
      <polygon points="50,6 95,39 78,92 22,92 5,39" />
    ),

    hexagon: (
      <polygon points="25,7 75,7 94,50 75,93 25,93 6,50" />
    ),

    octagon: (
      <polygon points="29,6 71,6 94,29 94,71 71,94 29,94 6,71 6,29" />
    ),

    crescent: (
      <path d="M72 9C51 17 39 34 39 54c0 20 12 37 33 45-7 3-14 4-22 2C25 97 8 77 8 53 8 28 25 8 48 4c8-1 16 1 24 5Z" />
    ),

    semicircle: (
      <path d="M10 50 C10 27.9 27.9 10 50 10 C72.1 10 90 27.9 90 50 L10 50 Z" />
    ),
  };

  return (
    <svg
      className={`math-shape math-shape-${name} ${className}`}
      viewBox="0 0 100 100"
      style={{
        "--shape-color": color,
      }}
      aria-hidden="true"
    >
      {paths[name] || paths.circle}
    </svg>
  );
}

function NumberVisual({ question }) {
  return (
    <div className="math-number-display">
      {question.display}
    </div>
  );
}

function CountingShapesVisual({
  question,
}) {
  const shapesToRender =
    question.targetShape === "all"
      ? question.shapes
      : Array.from(
          {
            length: question.count,
          },
          () => question.targetShape
        );

  return (
    <div
      className="math-count-display math-counting-shape-display"
      aria-label={`${question.count} shapes`}
    >
      {shapesToRender.map(
        (shape, index) => (
          <Shape
            key={`${shape}-${index}`}
            name={shape}
            color={
              countColors[
                index %
                  countColors.length
              ]
            }
          />
        )
      )}
    </div>
  );
}

function ShapeIntroductionVisual({
  question,
}) {
  return (
    <div className="math-introduction-visual">
      <div className="math-feature-display">
        <Shape
          name={question.shape}
          color="#55c6ff"
        />
      </div>

      <p>
        {question.teachingText}
      </p>
    </div>
  );
}

function ShapeFactVisual({
  question,
}) {
  return (
    <div className="math-feature-display">
      <Shape
        name={question.shape}
        color="#55c6ff"
      />
    </div>
  );
}

function ShapeRecognitionVisual({
  question,
}) {
  return (
    <div className="math-feature-display">
      <Shape
        name={question.shape}
        color="#ffd45c"
      />
    </div>
  );
}

function ColourVisual({
  question,
}) {
  const isTeaching =
    question.teaching;

  return (
    <div
      className={`math-colour-visual ${
        isTeaching
          ? "is-teaching"
          : ""
      }`}
    >
      <div className="math-feature-display">
        <Shape
          name={question.shape}
          color={question.color}
        />
      </div>

      {isTeaching &&
      question.teachingText ? (
        <p className="math-teaching-text">
          {question.teachingText}
        </p>
      ) : null}
    </div>
  );
}

function ColourMixingVisual({
  question,
}) {
  const isTeaching =
    question.teaching;

  return (
    <div
      className={`math-mix-display ${
        isTeaching
          ? "is-teaching"
          : ""
      }`}
      aria-label="Two colours to mix"
    >
      <div className="math-mix-colours">
        {question.mix.map(
          (color, index) => (
            <span
              key={`${color}-${index}`}
              className="math-mix-swatch"
              style={{
                backgroundColor:
                  color,
                width: "82px",
                height: "82px",
                display: "block",
                flex: "0 0 82px",
                border:
                  "4px solid #fff",
                borderRadius: "50%",
                boxShadow:
                  "0 0 18px #ffffff55",
              }}
            />
          )
        )}

        {isTeaching &&
        question.resultColor ? (
          <>
            <span className="math-mix-arrow">
              →
            </span>

            <span
              className="math-mix-swatch math-mix-result"
              style={{
                backgroundColor:
                  question.resultColor,
                width: "82px",
                height: "82px",
                display: "block",
                flex: "0 0 82px",
                border:
                  "4px solid #fff",
                borderRadius: "50%",
                boxShadow:
                  "0 0 18px #ffffff55",
              }}
            />
          </>
        ) : null}
      </div>

      {isTeaching &&
      question.teachingText ? (
        <p className="math-teaching-text">
          {question.teachingText}
        </p>
      ) : null}
    </div>
  );
}

function TwoPropertyVisual({
  question,
}) {
  const target =
    question.target;

  if (!target) {
    return null;
  }

  return (
    <div
      className="math-two-property-visual"
      aria-label="Target shape"
    >
      <div className="math-feature-display">
        <Shape
          name={target.shape}
          color={target.color}
        />
      </div>
    </div>
  );
}

function OperationIntroductionVisual({
  question,
}) {
  return (
    <div
      className="math-operation-introduction"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        minHeight: "180px",
      }}
    >
      <div
        style={{
          fontSize: "5rem",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {question.operation}
      </div>

      {question.teachingText ? (
        <p className="math-teaching-text">
          {question.teachingText}
        </p>
      ) : null}
    </div>
  );
}

function itemMatchesZone(
  item,
  zone
) {
  if (!item || !zone) {
    return false;
  }

  if (
    zone.targetShape &&
    item.shape !==
      zone.targetShape
  ) {
    return false;
  }

  const itemColor =
    item.colorName ||
    (typeof item.color ===
      "string" &&
    optionColors[item.color]
      ? item.color
      : null);

  if (
    zone.targetColor &&
    itemColor !==
      zone.targetColor
  ) {
    return false;
  }

  if (
    zone.targetType &&
    item.type !==
      zone.targetType
  ) {
    return false;
  }

  return Boolean(
    zone.targetShape ||
      zone.targetColor ||
      zone.targetType
  );
}

function getTargetItems(
  question,
  zone
) {
  return (question.items || []).filter(
    (item) =>
      itemMatchesZone(
        item,
        zone
      )
  );
}

function DraggableItem({
  item,
  position,
  dragging,
  onPointerDown,
  size = 76,
}) {
  if (!position) {
    return null;
  }

  const shape =
    getItemShape(item);

  const color =
    getItemColor(item);

  return (
    <div
      className={`math-draggable-item ${
        dragging
          ? "is-dragging"
          : ""
      }`}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        display: "grid",
        placeItems: "center",
        transform:
          "translate(-50%, -50%)",
        touchAction: "none",
        userSelect: "none",
        cursor: dragging
          ? "grabbing"
          : "grab",
        zIndex: dragging
          ? 100
          : 2,
        transition: dragging
          ? "none"
          : "left 0.22s ease, top 0.22s ease",
      }}
      onPointerDown={(event) =>
        onPointerDown(
          event,
          item.id
        )
      }
    >
      {shape ? (
        <Shape
          name={shape}
          color={color}
        />
      ) : item.icon ? (
        <span
          style={{
            fontSize:
              size <= 60
                ? "2.5rem"
                : "3.4rem",
            lineHeight: 1,
          }}
        >
          {item.icon}
        </span>
      ) : (
        <span
          style={{
            width:
              size <= 60
                ? "44px"
                : "58px",
            height:
              size <= 60
                ? "44px"
                : "58px",
            borderRadius: "50%",
            backgroundColor:
              color,
            border:
              "3px solid #fff",
            boxShadow:
              "0 0 18px #ffffff66",
          }}
        />
      )}
    </div>
  );
}

function InteractiveSortVisual({
  question,
  onComplete,
  onWrong,
}) {
  const containerRef =
    useRef(null);

  const [containerWidth, setContainerWidth] =
    useState(0);

  const [positions, setPositions] =
    useState({});

  const [placedPositions, setPlacedPositions] =
    useState({});

  const [placed, setPlaced] =
    useState({});

  const [draggingId, setDraggingId] =
    useState(null);

  const dragOffset =
    useRef({
      x: 0,
      y: 0,
    });

  const originalPositions =
    useRef({});

  const currentPointerId =
    useRef(null);

  const items =
    question.items || [];

  const zones =
    question.zones || [];

  const zone =
    zones[0];

  const targetItems =
    zone
      ? getTargetItems(
          question,
          zone
        )
      : [];

  useEffect(() => {
    const element =
      containerRef.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      setContainerWidth(
        element.clientWidth
      );
    };

    updateWidth();

    if (
      typeof ResizeObserver !==
      "undefined"
    ) {
      const observer =
        new ResizeObserver(
          updateWidth
        );

      observer.observe(element);

      return () =>
        observer.disconnect();
    }

    window.addEventListener(
      "resize",
      updateWidth
    );

    return () =>
      window.removeEventListener(
        "resize",
        updateWidth
      );
  }, []);

  const layoutWidth =
    containerWidth || 320;

  const isSmallPhone =
    layoutWidth <= 380;

  const isMobile =
    layoutWidth <= 600;

  const sourceColumns =
    isSmallPhone
      ? 2
      : isMobile
        ? 3
        : 5;

  const sourceHorizontalPadding =
    isMobile ? 28 : 72;

  const sourceSlotWidth =
    Math.max(
      (
        layoutWidth -
        sourceHorizontalPadding *
          2
      ) /
        sourceColumns,
      1
    );

  const sourceItemSize =
    isSmallPhone
      ? 54
      : isMobile
        ? 58
        : 76;

  const sourceRowGap =
    isMobile ? 76 : 88;

  const sourceRows =
    Math.max(
      Math.ceil(
        items.length /
          sourceColumns
      ),
      1
    );

  const objectAreaHeight =
    isMobile
      ? Math.max(
          150,
          sourceRows *
            sourceRowGap +
            38
        )
      : Math.max(
          250,
          sourceRows *
            sourceRowGap +
            38
        );

  const zoneColumns =
    isSmallPhone
      ? 2
      : isMobile
        ? 3
        : 4;

  const zoneHorizontalPadding =
    isMobile ? 14 : 24;

  const zoneSlotWidth =
    Math.max(
      (
        layoutWidth -
        zoneHorizontalPadding *
          2
      ) /
        zoneColumns,
      1
    );

  const zoneRowHeight =
    isMobile ? 64 : 68;

  const zoneRows =
    Math.max(
      Math.ceil(
        targetItems.length /
          zoneColumns
      ),
      1
    );

  const zoneHeight =
    isMobile
      ? Math.max(
          150,
          zoneRows *
            zoneRowHeight +
            34
        )
      : Math.max(
          190,
          zoneRows *
            zoneRowHeight +
            34
        );

  useEffect(() => {
    setPlaced({});
    setPlacedPositions({});
    setDraggingId(null);
    currentPointerId.current =
      null;
  }, [question]);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const nextPositions =
      {};

    items.forEach(
      (item, index) => {
        const column =
          index %
          sourceColumns;

        const row =
          Math.floor(
            index /
              sourceColumns
          );

        nextPositions[
          item.id
        ] = {
          x:
            sourceHorizontalPadding +
            sourceSlotWidth *
              (column + 0.5),
          y:
            30 +
            row *
              sourceRowGap,
        };
      }
    );

    setPositions(
      (current) => {
        const next = {
          ...current,
        };

        Object.entries(
          nextPositions
        ).forEach(
          ([itemId, position]) => {
            if (!placed[itemId]) {
              next[itemId] =
                position;
            }
          }
        );

        return next;
      }
    );

    originalPositions.current =
      nextPositions;
  }, [
    layoutWidth,
    items,
    sourceColumns,
    sourceHorizontalPadding,
    sourceSlotWidth,
    sourceRowGap,
    placed,
  ]);

  useEffect(() => {
    if (!targetItems.length) {
      return;
    }

    const nextPlacedPositions =
      {};

    targetItems.forEach(
      (item, index) => {
        if (!placed[item.id]) {
          return;
        }

        const column =
          index %
          zoneColumns;

        const row =
          Math.floor(
            index /
              zoneColumns
          );

        nextPlacedPositions[
          item.id
        ] = {
          x:
            zoneHorizontalPadding +
            zoneSlotWidth *
              (column + 0.5),
          y:
            30 +
            row *
              zoneRowHeight,
        };
      }
    );

    setPlacedPositions(
      nextPlacedPositions
    );
  }, [
    layoutWidth,
    targetItems,
    placed,
    zoneColumns,
    zoneHorizontalPadding,
    zoneSlotWidth,
    zoneRowHeight,
  ]);

  const getContainerPoint =
    (event) => {
      const rect =
        containerRef.current?.getBoundingClientRect();

      if (!rect) {
        return {
          x: 0,
          y: 0,
        };
      }

      return {
        x:
          event.clientX -
          rect.left,
        y:
          event.clientY -
          rect.top,
      };
    };

  const getZoneAtPoint = (
    x,
    y
  ) => {
    const container =
      containerRef.current;

    if (!container) {
      return null;
    }

    const containerRect =
      container.getBoundingClientRect();

    const absoluteX =
      containerRect.left + x;

    const absoluteY =
      containerRect.top + y;

    const zoneElements =
      container.querySelectorAll(
        "[data-sort-zone]"
      );

    for (
      const zoneElement of zoneElements
    ) {
      const rect =
        zoneElement.getBoundingClientRect();

      if (
        absoluteX >= rect.left &&
        absoluteX <= rect.right &&
        absoluteY >= rect.top &&
        absoluteY <= rect.bottom
      ) {
        return (
          zoneElement.dataset
            .sortZone
        );
      }
    }

    return null;
  };

  const startDrag = (
    event,
    itemId
  ) => {
    if (
      placed[itemId] ||
      draggingId ||
      currentPointerId.current !== null ||
      (event.pointerType === "touch" && !event.isPrimary)
    ) {
      return;
    }

    event.preventDefault();

    const point =
      getContainerPoint(event);

    const currentPosition =
      positions[itemId];

    if (!currentPosition) {
      return;
    }

    dragOffset.current = {
      x:
        point.x -
        currentPosition.x,
      y:
        point.y -
        currentPosition.y,
    };

    currentPointerId.current =
      event.pointerId;

    setDraggingId(itemId);

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );
  };

  const moveDrag = (
    event
  ) => {
    if (
      !draggingId ||
      event.pointerId !==
        currentPointerId.current
    ) {
      return;
    }

    event.preventDefault();

    const point =
      getContainerPoint(event);

    setPositions(
      (current) => ({
        ...current,
        [draggingId]: {
          x:
            point.x -
            dragOffset.current
              .x,
          y:
            point.y -
            dragOffset.current
              .y,
        },
      })
    );
  };

  const resetItem = (
    itemId
  ) => {
    const original =
      originalPositions
        .current[itemId];

    if (!original) {
      return;
    }

    setPositions(
      (current) => ({
        ...current,
        [itemId]: original,
      })
    );
  };

  const finishDrag = (
    event
  ) => {
    if (
      !draggingId ||
      event.pointerId !==
        currentPointerId.current
    ) {
      return;
    }

    event.preventDefault();

    const itemId =
      draggingId;

    const item =
      items.find(
        (entry) =>
          entry.id === itemId
      );

    const point =
      getContainerPoint(event);

    const zoneId =
      getZoneAtPoint(
        point.x,
        point.y
      );

    setDraggingId(null);

    currentPointerId.current =
      null;

    if (!item || !zoneId) {
      resetItem(itemId);
      return;
    }

    const targetZone =
      zones.find(
        (entry) =>
          entry.id === zoneId
      );

    if (
      !itemMatchesZone(
        item,
        targetZone
      )
    ) {
      resetItem(itemId);
      onWrong?.();
      return;
    }

    const nextPlaced = {
      ...placed,
      [itemId]: zoneId,
    };

    setPlaced(
      nextPlaced
    );

    const targetIndex =
      targetItems.findIndex(
        (targetItem) =>
          targetItem.id ===
          itemId
      );

    const column =
      targetIndex %
      zoneColumns;

    const row =
      Math.floor(
        targetIndex /
          zoneColumns
      );

    const nextPlacedPosition =
      {
        x:
          zoneHorizontalPadding +
          zoneSlotWidth *
            (column + 0.5),
        y:
          30 +
          row *
            zoneRowHeight,
      };

    setPlacedPositions(
      (current) => ({
        ...current,
        [itemId]:
          nextPlacedPosition,
      })
    );

    const placedTargetCount =
      targetItems.filter(
        (targetItem) =>
          nextPlaced[
            targetItem.id
          ] === zoneId
      ).length;

    if (
      placedTargetCount ===
      targetItems.length
    ) {
      window.setTimeout(
        () => {
          onComplete?.();
        },
        450
      );
    }
  };

  if (
    !items.length ||
    !zones.length
  ) {
    return null;
  }

  const placedTargetCount =
    targetItems.filter(
      (item) =>
        placed[item.id]
    ).length;

  return (
    <div
      ref={containerRef}
      className="math-interactive-sort"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "760px",
        margin:
          "20px auto 0",
        touchAction: "none",
        userSelect: "none",
        boxSizing: "border-box",
      }}
      onPointerMove={
        moveDrag
      }
      onPointerUp={
        finishDrag
      }
      onPointerCancel={
        finishDrag
      }
    >
      <div
        className="math-sort-object-area"
        style={{
          position: "relative",
          width: "100%",
          height: `${objectAreaHeight}px`,
          border:
            "2px dashed #8fe7ff55",
          borderRadius:
            "18px",
          background:
            "#ffffff08",
          overflow:
            "hidden",
          boxSizing:
            "border-box",
        }}
      >
        {items.map(
          (item) => {
            if (
              placed[item.id]
            ) {
              return null;
            }

            return (
              <DraggableItem
                key={item.id}
                item={item}
                position={
                  positions[
                    item.id
                  ]
                }
                dragging={
                  draggingId ===
                  item.id
                }
                onPointerDown={
                  startDrag
                }
                size={
                  sourceItemSize
                }
              />
            );
          }
        )}
      </div>

      <div
        className="math-sort-zones"
        style={{
          width: "100%",
          marginTop:
            "18px",
        }}
      >
        <div
          data-sort-zone={
            zone.id
          }
          className="math-sort-zone"
          style={{
            position:
              "relative",
            width: "100%",
            minHeight:
              `${zoneHeight}px`,
            border:
              "3px dashed #8fe7ff",
            borderRadius:
              "18px",
            background:
              "#ffffff0d",
            overflow:
              "hidden",
            boxSizing:
              "border-box",
          }}
        >
          {targetItems.map(
            (item) => {
              if (
                !placed[
                  item.id
                ]
              ) {
                return null;
              }

              const boxPosition =
                placedPositions[
                  item.id
                ];

              if (
                !boxPosition
              ) {
                return null;
              }

              return (
                <div
                  key={
                    item.id
                  }
                  style={{
                    position:
                      "absolute",
                    left: `${boxPosition.x}px`,
                    top: `${boxPosition.y}px`,
                    width:
                      isMobile
                        ? "48px"
                        : "60px",
                    height:
                      isMobile
                        ? "48px"
                        : "60px",
                    transform:
                      "translate(-50%, -50%)",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    pointerEvents:
                      "none",
                    zIndex: 2,
                  }}
                >
                  <Shape
                    name={
                      getItemShape(
                        item
                      )
                    }
                    color={
                      getItemColor(
                        item
                      )
                    }
                  />
                </div>
              );
            }
          )}
        </div>
      </div>

      <div
        style={{
          marginTop:
            "8px",
          textAlign:
            "center",
          color:
            "#c7d2f6",
          fontSize:
            isSmallPhone
              ? "0.75rem"
              : "0.85rem",
          fontWeight: 800,
        }}
      >
        {placedTargetCount} of{" "}
        {targetItems.length}
      </div>
    </div>
  );
}

function MatchingVisual({
  question,
  onInteractiveComplete,
  onInteractiveWrong,
}) {
  if (
    question.items &&
    question.zones
  ) {
    return (
      <InteractiveSortVisual
        question={question}
        onComplete={
          onInteractiveComplete
        }
        onWrong={
          onInteractiveWrong
        }
      />
    );
  }

  if (question.quantity) {
    return (
      <div
        className="math-count-display"
        aria-label={`${question.quantity} shapes`}
      >
        {Array.from(
          {
            length:
              question.quantity,
          },
          (_, index) => (
            <Shape
              key={index}
              name={
                question.matchShape
              }
              color="#ffd45c"
            />
          )
        )}
      </div>
    );
  }

  if (question.match) {
    return (
      <div className="math-feature-display">
        <Shape
          name={
            question.match.shape
          }
          color={
            question.match.color
          }
        />
      </div>
    );
  }

  return (
    <ColourVisual
      question={question}
    />
  );
}

function SortingVisual({
  question,
  onInteractiveComplete,
  onInteractiveWrong,
}) {
  if (
    question.items &&
    question.zones
  ) {
    return (
      <InteractiveSortVisual
        question={question}
        onComplete={
          onInteractiveComplete
        }
        onWrong={
          onInteractiveWrong
        }
      />
    );
  }

  if (
    question.twoProperties
  ) {
    return (
      <TwoPropertyVisual
        question={question}
      />
    );
  }

  if (question.sort) {
    return (
      <div className="math-group-display">
        {Array.from(
          { length: 4 },
          (_, index) => (
            <Shape
              key={index}
              name={
                question.sort
              }
              color="#66d17a"
            />
          )
        )}
      </div>
    );
  }

  if (
    question.oddOneOut
  ) {
    return (
      <div className="math-feature-row">
        {question.oddOneOut.map(
          (shape, index) => (
            <Shape
              key={`${shape}-${index}`}
              name={shape}
              color="#55c6ff"
            />
          )
        )}
      </div>
    );
  }

  return (
    <ColourVisual
      question={question}
    />
  );
}

function ArithmeticVisual({
  question,
}) {
  const [
    first,
    second,
  ] = question.values || [];

  if (
    first == null ||
    second == null
  ) {
    return (
      <OperationIntroductionVisual
        question={question}
      />
    );
  }

  const isSubtraction =
    question.operation ===
    "-";

  const objectShape =
    question.object &&
    Object.values(shapes).includes(
      question.object
    )
      ? question.object
      : "circle";

  const objectColor =
    question.color ||
    colors.blue;

  if (isSubtraction) {
    return (
      <div
        className="math-arithmetic-display"
        aria-label={`Take ${second} shapes away from ${first} shapes`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          width: "100%",
          margin: "20px auto",
        }}
      >
        <div
          className="math-arithmetic-group"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, 62px)",
            justifyContent:
              "center",
            gap: "6px",
            width: "100%",
            maxWidth: "360px",
          }}
        >
          {Array.from(
            {
              length: first,
            },
            (_, index) => (
              <span
                key={index}
                className="math-object"
                style={{
                  width: "62px",
                  height: "62px",
                  display: "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Shape
                  name={
                    objectShape
                  }
                  color={
                    objectColor
                  }
                />
              </span>
            )
          )}
        </div>

        <strong
          className="math-operation-symbol"
          style={{
            fontSize: "2.4rem",
            lineHeight: 1,
            margin: "2px 0",
          }}
        >
          −
        </strong>

        <div
          className="math-arithmetic-group"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, 62px)",
            justifyContent:
              "center",
            gap: "6px",
            width: "100%",
            maxWidth: "360px",
          }}
        >
          {Array.from(
            {
              length: second,
            },
            (_, index) => (
              <span
                key={index}
                className="math-object"
                style={{
                  width: "62px",
                  height: "62px",
                  display: "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Shape
                  name={
                    objectShape
                  }
                  color={
                    objectColor
                  }
                />
              </span>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="math-arithmetic-display"
      aria-label={`${first} ${question.operation} ${second}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        flexWrap: "wrap",
        width: "100%",
        margin: "20px auto",
      }}
    >
      <div
        className="math-arithmetic-group"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, 62px)",
          justifyContent:
            "center",
          gap: "6px",
          maxWidth: "360px",
        }}
      >
        {Array.from(
          {
            length: first,
          },
          (_, index) => (
            <span
              key={index}
              className="math-object"
              style={{
                width: "62px",
                height: "62px",
                display: "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <Shape
                name={objectShape}
                color={objectColor}
              />
            </span>
          )
        )}
      </div>

      <strong
        className="math-operation-symbol"
        style={{
          fontSize: "2.4rem",
          lineHeight: 1,
        }}
      >
        +
      </strong>

      <div
        className="math-arithmetic-group"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, 62px)",
          justifyContent:
            "center",
          gap: "6px",
          maxWidth: "360px",
        }}
      >
        {Array.from(
          {
            length: second,
          },
          (_, index) => (
            <span
              key={index}
              className="math-object"
              style={{
                width: "62px",
                height: "62px",
                display: "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <Shape
                name={objectShape}
                color={objectColor}
              />
            </span>
          )
        )}
      </div>
    </div>
  );
}

function NumberEquationVisual({
  question,
}) {
  const first =
    question.values?.[0] ??
    question.dividend;

  const second =
    question.values?.[1] ??
    question.divisor;

  const operation =
    question.operation ||
    (question.type ===
    "division-numbers"
      ? "÷"
      : question.type ===
          "multiplication-numbers"
        ? "×"
        : "");

  return (
    <div className="math-number-equation">
      {first} {operation}{" "}
      {second} = ?
    </div>
  );
}

function GroupingVisual({
  question,
}) {
  const groups =
    question.groups || [];

  const objectShape =
    question.object &&
    Object.values(shapes).includes(
      question.object
    )
      ? question.object
      : "circle";

  const objectColor =
    question.color ||
    colors.blue;

  const isMultiplication =
    question.multiplication ||
    question.operation ===
      "×";

  return (
    <div
      className="math-equal-groups"
      aria-label={
        isMultiplication
          ? `${question.groupsCount} groups of ${groups[0]}`
          : "Equal groups"
      }
      style={{
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        gap: "22px",
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {groups.map(
        (
          group,
          groupIndex
        ) => (
          <div
            className="math-small-group"
            key={groupIndex}
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              flexWrap:
                "wrap",
              gap: "8px",
              padding:
                "14px",
              minWidth:
                "105px",
              minHeight:
                "90px",
              border:
                "2px solid #8fe7ff55",
              borderRadius:
                "16px",
            }}
          >
            {Array.from(
              {
                length: group,
              },
              (
                _,
                itemIndex
              ) => (
                <span
                  key={
                    itemIndex
                  }
                  style={{
                    display:
                      "inline-flex",
                    width: "48px",
                    height: "48px",
                  }}
                >
                  <Shape
                    name={
                      objectShape
                    }
                    color={
                      objectColor
                    }
                  />
                </span>
              )
            )}
          </div>
        )
      )}

      {isMultiplication ? (
        <>
          <strong
            className="math-operation-symbol"
            style={{
              fontSize:
                "2rem",
            }}
          >
            ×
          </strong>

          <span
            style={{
              fontSize:
                "1.1rem",
              fontWeight:
                800,
              color:
                "#c7d2f6",
            }}
          >
            {question.groupsCount} groups
          </span>
        </>
      ) : null}
    </div>
  );
}

function SharingVisual({
  question,
}) {
  const groups =
    question.groups || [];

  const objectShape =
    question.object &&
    Object.values(shapes).includes(
      question.object
    )
      ? question.object
      : "circle";

  const objectColor =
    question.color ||
    colors.blue;

  return (
    <div
      className="math-sharing-display"
      aria-label="Shapes shared into equal groups"
      style={{
        display: "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        gap: "22px",
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {groups.map(
        (
          count,
          groupIndex
        ) => (
          <div
            className="math-small-group"
            key={groupIndex}
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              flexWrap:
                "wrap",
              gap: "8px",
              padding:
                "14px",
              minWidth:
                "105px",
              minHeight:
                "90px",
              border:
                "2px solid #8fe7ff55",
              borderRadius:
                "16px",
            }}
          >
            {Array.from(
              {
                length:
                  count,
              },
              (
                _,
                itemIndex
              ) => (
                <span
                  className="math-object"
                  key={
                    itemIndex
                  }
                  style={{
                    display:
                      "inline-flex",
                    width: "48px",
                    height: "48px",
                  }}
                >
                  <Shape
                    name={
                      objectShape
                    }
                    color={
                      objectColor
                    }
                  />
                </span>
              )
            )}
          </div>
        )
      )}
    </div>
  );
}

const visualRenderers = {
  number:
    NumberVisual,

  "shape-introduction":
    ShapeIntroductionVisual,

  "shape-sides":
    ShapeFactVisual,

  "shape-corners":
    ShapeFactVisual,

  "shape-recognition":
    ShapeRecognitionVisual,

  "counting-shapes":
    CountingShapesVisual,

  "colour-introduction":
    ColourVisual,

  "colour-recognition":
    ColourVisual,

  "colour-mixing":
    ColourMixingVisual,

  matching:
    MatchingVisual,

  sorting:
    SortingVisual,

  "addition-introduction":
    OperationIntroductionVisual,

  "addition-objects":
    ArithmeticVisual,

  "addition-numbers":
    NumberEquationVisual,

  "subtraction-introduction":
    OperationIntroductionVisual,

  "subtraction-objects":
    ArithmeticVisual,

  "subtraction-numbers":
    NumberEquationVisual,

  "multiplication-introduction":
    OperationIntroductionVisual,

  "multiplication-numbers":
    NumberEquationVisual,

  "equal-groups":
    GroupingVisual,

  sharing:
    SharingVisual,

  "division-introduction":
    OperationIntroductionVisual,

  "division-numbers":
    NumberEquationVisual,
};

function QuestionVisual({
  question,
  onInteractiveComplete,
  onInteractiveWrong,
}) {
  const Renderer =
    visualRenderers[
      question.type
    ];

  if (!Renderer) {
    return null;
  }

  return (
    <Renderer
      question={question}
      onInteractiveComplete={
        onInteractiveComplete
      }
      onInteractiveWrong={
        onInteractiveWrong
      }
    />
  );
}

function OptionVisual({
  option,
  question,
}) {
  if (
    question?.twoProperties &&
    option &&
    typeof option ===
      "object"
  ) {
    const count =
      option.count || 3;

    return (
      <span
        className="math-two-property-option"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          gap: "6px",
          width: "100%",
          minHeight:
            "72px",
        }}
      >
        {Array.from(
          {
            length: count,
          },
          (_, index) => (
            <Shape
              key={`${option.id}-${index}`}
              name={
                option.shape
              }
              color={
                option.color
              }
              className="math-two-property-option-shape"
            />
          )
        )}
      </span>
    );
  }

  if (
    typeof option ===
      "string" &&
    optionColors[option]
  ) {
    return (
      <span
        className="math-colour-swatch"
        style={{
          width: "42px",
          height: "42px",
          minWidth: "42px",
          minHeight: "42px",
          display: "block",
          borderRadius: "50%",
          backgroundColor:
            optionColors[
              option
            ],
          border:
            "3px solid #ffffff",
          boxShadow:
            "0 0 14px #ffffff66",
        }}
        aria-hidden="true"
      />
    );
  }

  if (
    typeof option ===
      "string" &&
    shapes[option]
  ) {
    return (
      <Shape
        name={option}
        color="#55c6ff"
      />
    );
  }

  if (
    typeof option ===
      "string" &&
    option.includes(" ")
  ) {
    const parts =
      option
        .trim()
        .split(/\s+/);

    if (
      parts.length === 2
    ) {
      const [
        optionColor,
        optionShape,
      ] = parts;

      if (
        optionColors[
          optionColor
        ] &&
        shapes[
          optionShape
        ]
      ) {
        return (
          <Shape
            name={
              optionShape
            }
            color={
              optionColors[
                optionColor
              ]
            }
          />
        );
      }
    }
  }

  if (
    question?.type ===
      "matching" &&
    question.quantity
  ) {
    return option;
  }

  if (
    question?.type ===
      "sorting" &&
    question.groups &&
    question.groups.every(
      (item) =>
        /^\d+$/.test(item)
    )
  ) {
    return (
      <span className="math-option-group">
        {Array.from(
          {
            length:
              Number(
                option
              ),
          },
          (_, index) => (
            <Shape
              key={index}
              name="circle"
              color="#55c6ff"
            />
          )
        )}
      </span>
    );
  }

  if (
    question?.type ===
      "sorting" &&
    question.sort &&
    shapes[option]
  ) {
    return (
      <span className="math-option-group">
        {Array.from(
          { length: 4 },
          (_, index) => (
            <Shape
              key={index}
              name={option}
              color="#66d17a"
            />
          )
        )}
      </span>
    );
  }

  if (
    question?.type ===
      "sorting" &&
    question.oddOneOut &&
    shapes[option]
  ) {
    return (
      <Shape
        name={option}
        color="#55c6ff"
      />
    );
  }

  return option;
}

function shuffleOptions(
  options
) {
  if (!Array.isArray(options)) {
    return [];
  }

  const shuffled = [
    ...options,
  ];

  for (
    let index =
      shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [
      shuffled[index],
      shuffled[randomIndex],
    ] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [
      shuffled[index],
      shuffled[randomIndex],
    ] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function getAssessmentQuestions() {
  const selected = [];

  assessmentSkills.forEach((skill) => {
    const seen = new Set();
    const skillPool = shuffleArray(
      mathAssessmentQuestions.filter(
        (question) =>
          question.skill === skill.id
      ).filter((question) => {
        if (seen.has(question.assessmentId)) return false;
        seen.add(question.assessmentId);
        return true;
      })
    );

    selected.push(
      ...skillPool.slice(0, 2)
    );
  });

  return shuffleArray(selected);
}

export default function MathSection({
  onHome,
  onBack,
  soundOn,
}) {
  const [progress, setProgress] =
    useState(
      readProgress
    );

  const [screen, setScreen] =
    useState("map");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector(".app")?.scrollTo(0, 0);
  }, [screen]);

  const [feedback, setFeedback] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const questionNarrationDelayRef = useRef(250);
  const victoryAudioRef = useRef(null);

  const [
    assessmentAnswers,
    setAssessmentAnswers,
  ] = useState(() => readAssessmentAttempt().answers);

  const [
    assessmentQuestions,
    setAssessmentQuestions,
  ] = useState(() => readAssessmentAttempt().questions);

  const [assessmentActive, setAssessmentActive] =
    useState(() => readAssessmentAttempt().active);

  const mission =
    mathMissions.find(
      (item) =>
        item.id ===
        progress.activeMission
    ) ||
    mathMissions[0];

  const questions =
    useMemo(() => {
      if (mission.assessment) {
        return assessmentQuestions;
      }

      return getMissionQuestions(
        mission
      );
    }, [
      mission,
      assessmentQuestions,
    ]);

  const question =
    questions[
      progress.question
    ] ||
    questions[0];

  /*
   * Accessibility speech for Maths.
   *
   * Every Maths question gets TTS when it appears.
   * The question prompt is spoken, but the answer is
   * never spoken automatically.
   *
   * The trigger is tied to the question number rather
   * than the question object so narration is deterministic.
   */
  useEffect(() => {
    if (
      !soundOn ||
      screen !== "mission" ||
      !question ||
      !question.prompt
    ) {
      return;
    }

    const narrationDelay = questionNarrationDelayRef.current;
    questionNarrationDelayRef.current = 250;

    const timer = window.setTimeout(() => {
      speak(question.prompt);
    }, narrationDelay);

    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [
    screen,
    mission.id,
    progress.question,
    question,
    soundOn,
  ]);

  useEffect(() => {
    if (!soundOn) {
      return undefined;
    }

    const prompts = {
      map: "Choose a planet for your next maths mission.",
      planet: `Welcome to ${mission.title}. ${mission.description}.`,
      complete: `Mission accomplished! You completed your maths mission on ${mission.title}.`,
      "assessment-results":
        "Mission accomplished! You completed your final maths assessment.",
    };

    const prompt = prompts[screen];
    if (!prompt) {
      return undefined;
    }

    const narrationDelay =
      screen === "complete" || screen === "assessment-results"
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
    mission.description,
    mission.title,
    screen,
    soundOn,
  ]);

  useEffect(() => {
    const victoryScreen =
      screen === "complete" || screen === "assessment-results";

    if (!soundOn || !victoryScreen) {
      stopAudioRef(victoryAudioRef);
      return undefined;
    }

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
  }, [screen, soundOn]);

  const shuffledOptions =
    useMemo(() => {
      if (
        !question ||
        question.teaching ||
        question.items ||
        question.zones
      ) {
        return [];
      }

      return shuffleOptions(
        question.options ||
          []
      );
    }, [
      mission.id,
      progress.question,
      question,
    ]);

  const isAssessment =
    mission.assessment;

  const isInteractive =
    Boolean(
      question?.items &&
        question?.zones
    );

  const journeyPercent =
    questions.length > 1
      ? (progress.question /
          (questions.length -
            1)) *
        100
      : 100;

  useEffect(() => {
    const savedProgress = {
      ...progress,
      missions: {
        ...progress.missions,
        [progress.activeMission]: progress.question,
      },
    };

    localStorage.setItem(
      "oatle-maths-progress",
      JSON.stringify(savedProgress)
    );
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(
      MATH_ASSESSMENT_ATTEMPT_KEY,
      JSON.stringify({
        active: assessmentActive,
        questionIds: assessmentQuestions.map(
          (question) => question.assessmentId
        ),
        answers: assessmentAnswers,
      })
    );
  }, [assessmentActive, assessmentAnswers, assessmentQuestions]);

  const assessmentSummary =
    useMemo(() => {
      const total =
        assessmentAnswers.length;

      const correct =
        assessmentAnswers.filter(
          (answer) =>
            answer.correct
        ).length;

      return {
        total,
        correct,
      };
    }, [
      assessmentAnswers,
    ]);

  const assessmentSkillResults =
    useMemo(() => {
      return assessmentSkills.map(
        (skill) => {
          const answers =
            assessmentAnswers.filter(
              (answer) =>
                answer.skill ===
                skill.id
            );

          const correct =
            answers.filter(
              (answer) =>
                answer.correct
            ).length;

          const total =
            answers.length;

          const percentage =
            total > 0
              ? Math.round(
                  (correct / total) *
                    100
                )
              : 0;

          let status =
            "Keep Practicing";

          if (percentage >= 90) {
            status = "Strong";
          } else if (
            percentage >= 70
          ) {
            status = "Developing";
          }

          return {
            ...skill,
            correct,
            total,
            percentage,
            status,
          };
        }
      );
    }, [
      assessmentAnswers,
    ]);

  const playSound = (
    sound
  ) => {
    if (!soundOn) return;

    const effect =
      new Audio(sound);

    effect.volume = 0.55;

    effect
      .play()
      .catch(() => {});
  };

  const startMission = (
    id
  ) => {
    const selectedMission =
      mathMissions.find(
        (item) => item.id === id
      );

    let assessmentQuestionSet = [];
    let assessmentAnswerSet = [];
    let assessmentQuestionIndex = 0;

    if (selectedMission?.assessment) {
      const savedAttempt = readAssessmentAttempt();

      if (
        savedAttempt.active &&
        savedAttempt.questions.length > 0
      ) {
        assessmentQuestionSet = savedAttempt.questions;
        assessmentAnswerSet = savedAttempt.answers;
        assessmentQuestionIndex = Math.min(
          savedAttempt.answers.length,
          savedAttempt.questions.length - 1
        );
      } else {
        assessmentQuestionSet = getAssessmentQuestions();
        setAssessmentActive(true);
      }

      setAssessmentQuestions(assessmentQuestionSet);
      setAssessmentAnswers(assessmentAnswerSet);
    } else {
      setAssessmentQuestions([]);
    }

    setProgress(
      (current) => {
        const saved = readProgress();
        const missions = {
          ...saved.missions,
          ...current.missions,
          [current.activeMission]: current.question,
        };

        return {
        ...current,
        missions,
        activeMission:
          id,
        question: selectedMission?.assessment
          ? assessmentQuestionIndex
          : missions[id] || 0,
        };
      }
    );

    setFeedback("");
    setIsProcessing(false);
    if (!selectedMission?.assessment) {
      setAssessmentAnswers([]);
    }
    setScreen("planet");
  };

  const beginMission = () => {
    questionNarrationDelayRef.current = soundOn ? 5800 : 250;
    playSound(blastoffSound);
    setFeedback("");
    setIsProcessing(false);
    setProgress((current) => ({
      ...current,
      startedMissions: {
        ...current.startedMissions,
        [current.activeMission]: true,
      },
    }));
    setScreen("mission");
  };

  const finishMission =
    () => {
      if (isAssessment) {
        setAssessmentActive(false);
        setScreen(
          "assessment-results"
        );
        return;
      }

      setProgress(
        (current) => ({
          ...withCompletedDestination(current, current.activeMission),
          unlocked:
            Math.max(
              current.unlocked,
              Math.min(
                current.activeMission +
                  1,
                mathMissions.length
              )
            ),
        })
      );

      setScreen(
        "complete"
      );
    };

  const advanceQuestion =
    () => {
      if (
        progress.question <
        questions.length - 1
      ) {
        setProgress(
          (current) => ({
            ...current,
            question:
              current.question +
              1,
          })
        );

        setFeedback("");
        setIsProcessing(
          false
        );
      } else {
        finishMission();
        setIsProcessing(
          false
        );
      }
    };

  const answerQuestion =
    (selectedAnswer) => {
      if (isProcessing) {
        return;
      }

      const correct = isAssessment
        ? selectedAnswer ===
          question.answer
        : question.teaching ||
          selectedAnswer ===
            question.answer;

      playSound(
        correct
          ? correctSound
          : wrongSound
      );

      setFeedback(
        correct
          ? "Great job!"
          : isAssessment
            ? `Not quite. The correct answer is ${question.answer}.`
            : "Almost! Try another answer."
      );

      const nextAssessmentAnswers =
        isAssessment
          ? [
              ...assessmentAnswers,
              {
                skill:
                  question.skill,
                correct,
              },
            ]
          : assessmentAnswers;

      if (isAssessment) {
        setAssessmentAnswers(
          nextAssessmentAnswers
        );
      }

      if (
        !correct &&
        !isAssessment
      ) {
        return;
      }

      setIsProcessing(
        true
      );

      window.setTimeout(
        advanceQuestion,
        isAssessment && !correct ? 2400 : 1100
      );
    };

  const handleInteractiveComplete =
    () => {
      if (isProcessing) {
        return;
      }

      playSound(
        correctSound
      );

      setFeedback(
        "Great job!"
      );

      setIsProcessing(
        true
      );

      window.setTimeout(
        advanceQuestion,
        1100
      );
    };

  const handleInteractiveWrong =
    () => {
      if (isProcessing) {
        return;
      }

      playSound(
        wrongSound
      );

      setFeedback(
        "Almost! Try another place."
      );

      window.setTimeout(
        () => {
          setFeedback("");
        },
        900
      );
    };

  if (screen === "map") {
    return <BigKidsPlanetJourney title="Maths Map" label="Maths mission journey"
      description="Complete each mission to unlock the next destination."
      currentId={progress.activeMission} onBack={onBack}
      items={mathMissions.map(item => ({
        id: item.id, title: PLANET_NAMES[item.id - 1], subtitle: item.title, image: item.image, color: item.color,
        locked: item.id > progress.unlocked, complete: item.id < progress.unlocked || Boolean(progress.completedMissions?.[item.id]) || (item.assessment && Object.keys(progress.assessmentResults || {}).length > 0),
        onSelect: () => startMission(item.id),
      }))} />;
  }

  if (screen === "planet") {
    const missionStarted = Boolean(
      progress.startedMissions?.[mission.id] ||
      (progress.missions?.[mission.id] || 0) > 0 ||
      (progress.activeMission === mission.id && progress.question > 0)
    );

    return (
      <main className="planet-overview math-planet-overview">
        <LocalBackButton
          className="page-back-button"
          label="Maths map"
          onClick={() => setScreen("map")}
        />

        <img
          className="planet-icon planet-art math-overview-planet"
          src={mission.image}
          alt=""
        />

        <p className="eyebrow">PLANET {mission.id}</p>
        <h1>Welcome to {mission.title}</h1>
        <p>
          {mission.description} You have {questions.length} questions to complete.
        </p>

        <button className="primary-button" onClick={beginMission} type="button">
          {mission.assessment
            ? missionStarted
              ? "Return to assessment"
              : "Start assessment"
            : missionStarted
              ? "Return to mission"
              : "Start mission"}
        </button>
      </main>
    );
  }

  if (screen === "complete") {
    return (
      <main className="celebration-panel">
        <LocalBackButton
          className="page-back-button"
          label="Maths map"
          onClick={() => setScreen("map")}
        />
        <p className="eyebrow">
          MISSION COMPLETE
        </p>

        <h1>
          Mission accomplished!
        </h1>

        <p className="celebration-message">
          You completed your maths mission on {mission.title}.
        </p>

        <img
          className="celebration-planet math-celebration-planet"
          src={mission.image}
          alt={mission.title}
        />

        <p className="celebration-subject">
          MATHS
        </p>

        <p className="celebration-description">
          {mission.description}
        </p>

        <div className="celebration-actions">
          <button
            className="primary-button"
            onClick={() => setScreen("map")}
            type="button"
          >
            Next mission →
          </button>

          <button
            className="secondary-button"
            onClick={onHome}
            type="button"
          >
            Back to adventures
          </button>
        </div>
      </main>
    );
  }

  if (
    screen ===
    "assessment-results"
  ) {
    return (
      <main className="celebration-panel math-assessment-results">
        <LocalBackButton
          className="page-back-button"
          label="Maths map"
          onClick={() => setScreen("map")}
        />
        <p className="eyebrow">
          MISSION COMPLETE
        </p>

        <h1>
          Mission accomplished!
        </h1>

        <p className="celebration-message">
          You completed your final maths assessment.
        </p>

        <div className="math-assessment-score">
          <strong>
            {assessmentSummary.correct}/{assessmentSummary.total}
          </strong>

          <span>
            {assessmentSummary.total > 0
              ? Math.round(
                  (assessmentSummary.correct /
                    assessmentSummary.total) *
                    100
                )
              : 0}%
          </span>
        </div>

        <p className="celebration-subject">
          MATHS ASSESSMENT
        </p>

        <div className="result-list">
          {assessmentSkillResults
            .filter((skill) => skill.total > 0)
            .map((skill) => (
              <div className="result-row" key={skill.id}>
                <strong>{skill.name}</strong>
                <span>{skill.correct}/{skill.total}</span>
                <span>{skill.percentage}%</span>
                <span>{skill.status}</span>
              </div>
            ))}
        </div>

        <div className="celebration-actions">
          <button
            className="primary-button"
            onClick={() => setScreen("map")}
            type="button"
          >
            View missions →
          </button>

          <button
            className="secondary-button"
            onClick={onHome}
            type="button"
          >
            Back to adventures
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="math-page math-mission-page">
      <LocalBackButton
        className="page-back-button"
        label="Planet"
        onClick={() => setScreen("planet")}
      />
      <div className="math-status-row">
        <button
          className="math-back-button"
          onClick={() =>
            setScreen("map")
          }
        >
          ← Missions
        </button>

        <span>
          {mission.title} ·{" "}
          {progress.question +
            1}{" "}
          of{" "}
          {questions.length}
        </span>
      </div>

      <div
        className="math-journey-track"
        aria-label={`${progress.question} questions completed`}
      >
        <img
          className="math-journey-planet"
          src={mission.image}
          alt=""
        />

        <div className="math-journey-line">
          <span
            className="math-journey-rocket"
            style={{
              left: `${journeyPercent}%`,
            }}
          >
            🚀
          </span>
        </div>
      </div>

      <p className="math-eyebrow">
        {isAssessment
          ? "SHOW WHAT YOU KNOW"
          : mission.title.toUpperCase()}
      </p>

      <h1>
        {question.prompt}
      </h1>

      <QuestionVisual
        question={question}
        onInteractiveComplete={
          handleInteractiveComplete
        }
        onInteractiveWrong={
          handleInteractiveWrong
        }
      />

      {/* Counting Helper
          Only available where it is useful:
          Mission 6 - Adding Numbers
          Mission 7 - Taking Away
      */}
      {[6, 7].includes(mission.id) ? (
        <AbacusHelper />
      ) : null}

      {mission.id === 8 &&
      !question.teaching &&
      [
        "equal-groups",
        "multiplication-numbers",
        "sharing",
        "division-numbers",
      ].includes(question.type) ? (
        <GroupingHelper
          key={`${mission.id}-${progress.question}`}
          question={question}
        />
      ) : null}

      {!isInteractive ? (
        <div
          className={`math-answer-grid ${
            shuffledOptions.length ===
            3
              ? "has-three-options"
              : ""
          }`}
        >
          {(question.teaching
            ? ["Continue"]
            : shuffledOptions
          ).map(
            (option, index) => {
              const optionKey =
                option &&
                typeof option ===
                  "object"
                  ? option.id ||
                    `${option.answer}-${index}`
                  : `${option}-${index}`;

              const selectedAnswer =
                option &&
                typeof option ===
                  "object"
                  ? option.answer
                  : option;

              return (
                <button
                  key={
                    optionKey
                  }
                  className="word-button math-answer-button"
                  onClick={() =>
                    answerQuestion(
                      question.teaching
                        ? "__continue__"
                        : selectedAnswer
                    )
                  }
                  disabled={
                    isProcessing
                  }
                >
                  {question.teaching ? (
                    option
                  ) : (
                    <OptionVisual
                      option={
                        option
                      }
                      question={
                        question
                      }
                    />
                  )}
                </button>
              );
            }
          )}
        </div>
      ) : null}

      <p
        className={`math-feedback ${
          feedback.includes(
            "Almost"
          )
            ? "is-wrong"
            : ""
        }`}
        aria-live="polite"
      >
        {feedback}
      </p>
    </main>
  );
}
