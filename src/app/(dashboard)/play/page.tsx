"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Infinity, ListOrdered, Play, Shuffle, Zap } from "lucide-react";
import { getCategories } from "@/lib/actions/categories";
import { createSession } from "@/lib/actions/sessions";
import { CategoryOverview } from "@/types/app";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { CategoryIcon } from "@/lib/category-icons";
import { PageHeader, SegmentedControl } from "@/components/shared/AppShell";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const COUNT_OPTIONS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "15", value: 15 },
  { label: "20", value: 20 },
  { label: "30", value: 30 },
  { label: "50", value: 50 },
];

export default function PlaySetupPage() {
  const [categories, setCategories] = useState<CategoryOverview[]>([]);
  const [profileId, setProfileId] = useState("");
  const [mode, setMode] = useState<"normal" | "hard">("normal");
  const [catSelection, setCatSelection] = useState<
    "all" | "specific" | "special"
  >("all");
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [count, setCount] = useState<
    "5" | "10" | "15" | "20" | "30" | "50" | "custom" | "infinity"
  >("10");
  const [customCount, setCustomCount] = useState("10");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    const sessionRes = await fetch("/api/auth/session");
    if (!sessionRes.ok) return;
    const session = await sessionRes.json();
    setProfileId(session.profile_id);

    const result = await getCategories(session.profile_id);
    if (result.success && result.data) {
      setCategories(result.data);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const customCountNumber = Number(customCount);
  const selectedCats =
    catSelection === "all"
      ? []
      : catSelection === "special"
        ? categories.filter((c) => c.is_special).map((c) => c.id)
        : selectedCatIds;
  const totalQuestions =
    catSelection === "all"
      ? categories.reduce((sum, c) => sum + c.question_count, 0)
      : catSelection === "special"
        ? categories.find((c) => c.is_special)?.question_count || 0
        : categories
            .filter((c) => selectedCatIds.includes(c.id))
            .reduce((sum, c) => sum + c.question_count, 0);
  const isMemorizeInOrder = mode === "normal" && !shuffleQuestions;
  const isCustomCountValid =
    isMemorizeInOrder ||
    count !== "custom" ||
    (Number.isInteger(customCountNumber) &&
      customCountNumber >= 1 &&
      customCountNumber <= 999);
  const selectedQuestionCount =
    isMemorizeInOrder
      ? totalQuestions
      : count === "infinity"
        ? null
        : count === "custom"
          ? isCustomCountValid
            ? customCountNumber
            : null
          : parseInt(count);
  const hasSelectedSpecificCategory =
    catSelection !== "specific" || selectedCatIds.length > 0;
  const hasEnoughQuestions =
    Boolean(profileId) &&
    hasSelectedSpecificCategory &&
    totalQuestions > 0 &&
    isCustomCountValid;
  const startLabel = isStarting
    ? "Starting..."
    : !profileId
      ? "Loading..."
      : !hasSelectedSpecificCategory
        ? "Select category"
        : !isCustomCountValid
          ? "Invalid count"
          : hasEnoughQuestions
            ? "Start"
            : "No questions";

  const handleStart = async () => {
    if (!profileId) {
      toast.error("Profile is still loading");
      return;
    }
    if (!hasSelectedSpecificCategory) {
      toast.error("Select at least one category");
      return;
    }
    if (
      !isCustomCountValid ||
      (count !== "infinity" && selectedQuestionCount === null)
    ) {
      toast.error("Enter a question count from 1 to 999");
      return;
    }
    if (totalQuestions <= 0) {
      toast.error("No questions found for this selection");
      return;
    }

    setIsStarting(true);
    try {
      const result = await createSession(profileId, {
        mode,
        categoryIds: selectedCats,
        isAllCategories: catSelection === "all",
        isInfinity: !isMemorizeInOrder && count === "infinity",
        questionLimit: selectedQuestionCount,
        shuffleQuestions,
      });

      if (result.success && result.data) {
        router.push(`/play/session/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to start session");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-5"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Play Setup"
          description="Choose the focus, pace, and card count for this session."
          icon={Play}
        />
      </motion.div>

      {/* Mode Selection */}
      <motion.div variants={itemVariants} className="panel space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-text-primary">Choose Mode</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMode("normal")}
            className={cn(
              "surface-hover rounded-lg border p-4 text-left focus-ring",
              mode === "normal"
                ? "border-accent-indigo bg-accent-indigo/5"
                : "border-border-subtle hover:border-text-muted",
            )}
          >
            <Compass
              className={cn(
                "w-6 h-6 mb-2",
                mode === "normal" ? "text-accent-indigo" : "text-text-muted",
              )}
            />
            <p
              className={cn(
                "font-medium",
                mode === "normal" ? "text-text-primary" : "text-text-secondary",
              )}
            >
              Normal Mode
            </p>
            <p className="text-xs text-text-muted mt-1">
              Unseen questions first, then random. Relaxed and exploratory.
            </p>
          </button>
          <button
            onClick={() => setMode("hard")}
            className={cn(
              "surface-hover rounded-lg border p-4 text-left focus-ring",
              mode === "hard"
                ? "border-accent-orange bg-orange-500/5"
                : "border-border-subtle hover:border-text-muted",
            )}
          >
            <Zap
              className={cn(
                "w-6 h-6 mb-2",
                mode === "hard" ? "text-accent-orange" : "text-text-muted",
              )}
            />
            <p
              className={cn(
                "font-medium",
                mode === "hard" ? "text-text-primary" : "text-text-secondary",
              )}
            >
              Hard Mode
            </p>
            <p className="text-xs text-text-muted mt-1">
              Targets weak spots: Super Hard -&gt; Hard -&gt; New -&gt; Good
              -&gt; Easy.
            </p>
          </button>
        </div>
      </motion.div>

      {/* Category Selection */}
      <motion.div variants={itemVariants} className="panel space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-text-primary">
          Select Categories
        </h2>
        <SegmentedControl
          value={catSelection}
          onChange={setCatSelection}
          className="grid-cols-1 sm:grid-cols-3"
          options={[
            { value: "all", label: "All Categories" },
            { value: "specific", label: "Choose Specific" },
            { value: "special", label: "Special Only" },
          ]}
        />

        {catSelection === "specific" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="max-h-56 overflow-y-auto rounded-lg border border-border-subtle bg-bg-secondary p-2 app-scrollbar"
          >
            {categories
              .filter((c) => !c.is_special)
              .map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedCatIds.includes(cat.id)}
                    onChange={(e) => {
                      setSelectedCatIds((prev) =>
                        e.target.checked
                          ? [...prev, cat.id]
                          : prev.filter((id) => id !== cat.id),
                      );
                    }}
                    className="w-4 h-4 rounded border-border-subtle bg-bg-quaternary text-accent-indigo accent-accent-indigo"
                  />
                  <span className="flex min-w-0 items-center gap-2 text-sm text-text-primary">
                    <CategoryIcon icon={cat.icon} className="h-4 w-4" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {cat.question_count}
                  </span>
                </label>
              ))}
          </motion.div>
        )}
      </motion.div>

      {/* Question Count */}
      <motion.div variants={itemVariants} className="panel space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-text-primary">
          How Many Questions?
        </h2>
        <div className="flex flex-wrap gap-2">
          {COUNT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCount(String(opt.value) as typeof count)}
              className={cn(
                "rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors focus-ring",
                count === String(opt.value)
                  ? "bg-accent-indigo text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setCount("custom")}
            className={cn(
              "rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors focus-ring",
              count === "custom"
                ? "bg-accent-indigo text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
            )}
          >
            Custom
          </button>
          <button
            onClick={() => setCount("infinity")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors focus-ring",
              count === "infinity"
                ? "bg-accent-indigo text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
            )}
          >
            <Infinity className="w-4 h-4" />
            Infinity
          </button>
        </div>
        {count === "custom" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <input
              type="number"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              onBlur={() => {
                if (!customCount) return;
                const next = Math.max(1, Math.min(999, Number(customCount)));
                if (Number.isFinite(next))
                  setCustomCount(String(Math.trunc(next)));
              }}
              min={1}
              max={999}
              className={cn(
                "field w-28 bg-bg-tertiary",
                isCustomCountValid
                  ? "border-border-subtle focus:border-accent-indigo/50"
                  : "border-accent-red focus:border-accent-red",
              )}
            />
            {!isCustomCountValid && (
              <p className="text-xs text-accent-red mt-2">
                Enter a number from 1 to 999.
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {mode === "normal" && (
        <motion.div variants={itemVariants} className="panel space-y-3 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-text-primary">
            Question Order
          </h2>
          <button
            type="button"
            onClick={() => setShuffleQuestions((value) => !value)}
            aria-pressed={shuffleQuestions}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-ring",
              shuffleQuestions
                ? "border-accent-indigo bg-accent-indigo/5"
                : "border-accent-green bg-emerald-500/5",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                shuffleQuestions
                  ? "bg-accent-indigo/15 text-accent-indigo"
                  : "bg-emerald-500/15 text-accent-green",
              )}
            >
              {shuffleQuestions ? (
                <Shuffle className="h-5 w-5" />
              ) : (
                <ListOrdered className="h-5 w-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-text-primary">
                {shuffleQuestions ? "Shuffle questions" : "Memorize in order"}
              </span>
              <span className="mt-1 block text-xs text-text-muted">
                {shuffleQuestions
                  ? "Use normal mode priority and randomize the queue."
                  : "Play every selected question from first to last, ignoring previous answers."}
              </span>
            </span>
          </button>
        </motion.div>
      )}

      {/* Summary + Start */}
      <motion.div
        variants={itemVariants}
        className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 rounded-lg border border-border-subtle bg-bg-primary/95 p-3 shadow-elevated backdrop-blur-lg md:bottom-4 md:p-4"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="text-text-secondary">
              <span className="capitalize font-medium text-text-primary">
                {mode}
              </span>{" "}
              mode - {totalQuestions} questions -{" "}
              {mode === "normal" && !shuffleQuestions
                ? totalQuestions
                : count === "infinity"
                ? "infinity"
                : (selectedQuestionCount ?? "--")}{" "}
              cards
            </p>
            <p className="text-xs text-text-muted">
              Estimated: 0-
              {mode === "normal" && !shuffleQuestions
                ? totalQuestions * 10
                : count === "infinity"
                ? "infinity"
                : (selectedQuestionCount || 0) * 10}{" "}
              pts
            </p>
          </div>
          <button
            onClick={handleStart}
            disabled={isStarting || !hasEnoughQuestions}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all sm:w-auto",
              hasEnoughQuestions
                ? "bg-accent-green hover:bg-green-600 text-white shadow-glow-green"
                : "bg-bg-quaternary text-text-muted cursor-not-allowed",
            )}
          >
            <Play className="w-5 h-5 fill-current" />
            {startLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
