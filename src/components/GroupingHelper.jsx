import { useMemo, useState } from "react";

import "./GroupingHelper.css";

const DOT_COLORS = [
  "#ef5b5b",
  "#ffd45c",
  "#55c6ff",
  "#66d17a",
  "#ff9f43",
  "#a875e8",
  "#f27bbd",
  "#35c7c4",
];

function getHelperSetup(question) {
  const isDivision =
    question.type === "sharing" ||
    question.type === "division-numbers";

  if (isDivision) {
    const total = Number(
      question.total ?? question.dividend
    );
    const groupCount = Number(
      question.groupsCount ??
        question.friends ??
        question.divisor
    );

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(groupCount) ||
      total < 1 ||
      groupCount < 1
    ) {
      return null;
    }

    return {
      mode: "division",
      total,
      groupCount,
      itemsPerGroup: Math.floor(total / groupCount),
      remainder: total % groupCount,
    };
  }

  const groupCount = Number(
    question.groupsCount ?? question.values?.[0]
  );
  const itemsPerGroup = Number(
    question.groups?.[0] ?? question.values?.[1]
  );
  const total = Number(
    question.total ?? groupCount * itemsPerGroup
  );

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(groupCount) ||
    !Number.isFinite(itemsPerGroup) ||
    total < 1 ||
    groupCount < 1 ||
    itemsPerGroup < 1
  ) {
    return null;
  }

  return {
    mode: "multiplication",
    total,
    groupCount,
    itemsPerGroup,
    remainder: 0,
  };
}

function CounterDot({ index }) {
  return (
    <span
      className="grouping-helper-dot"
      style={{
        "--counter-color":
          DOT_COLORS[index % DOT_COLORS.length],
      }}
      aria-hidden="true"
    />
  );
}

export default function GroupingHelper({ question }) {
  const setup = useMemo(
    () => getHelperSetup(question),
    [question]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  if (!setup) {
    return null;
  }

  const {
    mode,
    total,
    groupCount,
    itemsPerGroup,
    remainder,
  } = setup;

  const distributableTotal =
    mode === "division" ? total - remainder : total;

  const placed =
    mode === "multiplication"
      ? Math.min(step, itemsPerGroup) * groupCount
      : Math.min(step, distributableTotal);

  const groupAmounts = Array.from(
    { length: groupCount },
    (_, groupIndex) => {
      if (mode === "multiplication") {
        return Math.min(step, itemsPerGroup);
      }

      const completeRounds = Math.floor(
        placed / groupCount
      );
      const extraObjects = placed % groupCount;

      return (
        completeRounds +
        (groupIndex < extraObjects ? 1 : 0)
      );
    }
  );

  const isComplete = placed >= distributableTotal;
  const remaining = Math.max(total - placed, 0);

  const openHelper = () => {
    setStep(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <div className="grouping-helper">
        <button
          type="button"
          className="grouping-helper-trigger"
          onClick={openHelper}
          aria-label="Open equal groups helper"
        >
          <span aria-hidden="true">🪐</span>
          <span>Need help with groups?</span>
        </button>
      </div>
    );
  }

  const instruction =
    mode === "multiplication"
      ? `Make ${groupCount} equal groups with ${itemsPerGroup} in each group.`
      : `Share ${total} counters equally between ${groupCount} groups.`;

  return (
    <div className="grouping-helper">
      <section
        className="grouping-helper-content"
        aria-label="Equal groups helper"
      >
        <button
          type="button"
          className="grouping-helper-close"
          onClick={() => setIsOpen(false)}
          aria-label="Hide equal groups helper"
        >
          ×
        </button>

        <h2>Group Builder</h2>
        <p className="grouping-helper-instruction">
          {instruction}
        </p>

        {mode === "division" ? (
          <div className="grouping-helper-pool">
            <strong>{remaining} left to share</strong>
            <div className="grouping-helper-pool-dots">
              {Array.from(
                { length: remaining },
                (_, index) => (
                  <CounterDot key={index} index={placed + index} />
                )
              )}
            </div>
          </div>
        ) : null}

        <div className="grouping-helper-groups">
          {groupAmounts.map((amount, groupIndex) => (
            <div
              className="grouping-helper-group"
              key={groupIndex}
            >
              <strong>Group {groupIndex + 1}</strong>
              <div className="grouping-helper-group-dots">
                {Array.from(
                  { length: amount },
                  (_, index) => (
                    <CounterDot
                      key={index}
                      index={groupIndex * itemsPerGroup + index}
                    />
                  )
                )}
              </div>
              <span>{amount}</span>
            </div>
          ))}
        </div>

        {isComplete ? (
          <div className="grouping-helper-result" aria-live="polite">
            {mode === "multiplication" ? (
              <>
                <strong>
                  {groupCount} groups of {itemsPerGroup} make {total} altogether.
                </strong>
                <span>
                  {groupCount} × {itemsPerGroup} = {total}
                </span>
              </>
            ) : (
              <>
                <strong>
                  Each group gets {itemsPerGroup}.
                </strong>
                <span>
                  {total} ÷ {groupCount} = {itemsPerGroup}
                  {remainder > 0
                    ? ` with ${remainder} left over`
                    : ""}
                </span>
              </>
            )}
          </div>
        ) : (
          <p className="grouping-helper-progress" aria-live="polite">
            {mode === "multiplication"
              ? `${groupAmounts[0]} in each group so far`
              : `${placed} of ${distributableTotal} shared evenly`}
          </p>
        )}

        <div className="grouping-helper-actions">
          <button
            type="button"
            className="grouping-helper-step"
            onClick={() => setStep((current) => current + 1)}
            disabled={isComplete}
          >
            {mode === "multiplication"
              ? "Add one to every group"
              : "Share the next one"}
          </button>

          <button
            type="button"
            className="grouping-helper-reset"
            onClick={() => setStep(0)}
            disabled={step === 0}
          >
            Start again
          </button>
        </div>
      </section>
    </div>
  );
}
