import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, ButtonLink, Card, FormError, SelectField, SkillChip, SwapStrip, TextArea } from "./kit";
import { Modal } from "./modal";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAction, usePerson, useSwaps } from "@/lib/hooks";
import { REPORT_REASONS, type MatchKind, type PersonCard, type SkillRef } from "@/lib/types";
import { displayName, firstName } from "@/lib/utils";

const KIND: Record<MatchKind, { label: string; tone: "teach" | "learn" }> = {
  two_way: { label: "Two-way match", tone: "teach" },
  can_teach_me: { label: "Can teach you", tone: "learn" },
  wants_my_skill: { label: "Wants your skill", tone: "teach" },
};

const names = (skills: SkillRef[]) => skills.map((s) => s.name).join(", ");

/** The swap I already have open with this person, if any. */
export function useOpenSwapWith(personId: string) {
  const { data: swaps } = useSwaps();
  return swaps?.find((s) => s.other.id === personId && (s.status === "proposed" || s.status === "accepted")) ?? null;
}

export function SwapAction({ person, size = "md", onPropose }: { person: Pick<PersonCard, "id" | "teaches">; size?: "sm" | "md"; onPropose: () => void }) {
  const open = useOpenSwapWith(person.id);
  if (open?.status === "accepted")
    return (
      <ButtonLink to={`/swaps/${open.id}`} size={size} variant="secondary">
        Open your swap <ArrowRight />
      </ButtonLink>
    );
  if (open)
    return (
      <ButtonLink to="/swaps" size={size} variant="secondary">
        {open.i_proposed ? "Proposal sent" : "Answer their proposal"}
      </ButtonLink>
    );
  if (person.teaches.length === 0)
    return (
      <Button size={size} variant="secondary" disabled>
        Nothing to teach yet
      </Button>
    );
  return (
    <Button size={size} onClick={onPropose}>
      Propose a swap
    </Button>
  );
}

/** One line about someone: their headline, else what they bring. */
function tagline(p: PersonCard) {
  if (p.headline) return p.headline;
  const bio = p.bio?.trim().split(/(?<=[.!?])\s/)[0];
  if (bio) return bio;
  const where = [p.organization, p.location].filter(Boolean).join(" · ");
  if (where) return where;
  const t = p.teaches.length, l = p.learns.length;
  if (t || l) return [t && `Teaches ${t} skill${t > 1 ? "s" : ""}`, l && `learning ${l}`].filter(Boolean).join(" · ").replace(/^l/, "L");
  return "New to SkillBridge";
}

export function PersonCardView({ person }: { person: PersonCard }) {
  const [proposing, setProposing] = useState(false);
  const kind = person.kind ? KIND[person.kind] : null;
  const twoWay = person.they_teach.length > 0 && person.they_want.length > 0;
  const name = displayName(person.full_name);

  return (
    <Card as="article" className="flex flex-col gap-3 p-4 transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-foreground/15">
      <div className="flex items-start gap-3">
        <Avatar name={person.full_name} src={person.avatar_url} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium tracking-normal">
            <Link to={`/people/${person.id}`} className="hover:underline">
              {name}
            </Link>
          </h3>
          <p className="truncate text-[12px] text-muted-foreground">{tagline(person)}</p>
        </div>
        {kind && <Badge tone={kind.tone}>{kind.label}</Badge>}
      </div>

      {twoWay ? (
        <SwapStrip teach={names(person.they_want)} learn={names(person.they_teach)} />
      ) : person.they_teach.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
          Teaches
          {person.they_teach.map((s) => (
            <SkillChip key={s.id} tone="learn">
              {s.name}
            </SkillChip>
          ))}
          which you want to learn
        </p>
      ) : person.they_want.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
          Wants to learn
          {person.they_want.map((s) => (
            <SkillChip key={s.id} tone="teach">
              {s.name}
            </SkillChip>
          ))}
          from you
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {person.teaches.slice(0, 5).map((s) => (
            <SkillChip key={s.id}>{s.name}</SkillChip>
          ))}
          {person.teaches.length > 5 && <SkillChip>+{person.teaches.length - 5}</SkillChip>}
        </div>
      )}

      {person.bio && <p className="line-clamp-2 text-[13px] text-muted-foreground">{person.bio}</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <ButtonLink to={`/people/${person.id}`} variant="ghost" size="sm" className="-ml-2">
          View profile
        </ButtonLink>
        <SwapAction person={person} size="sm" onPropose={() => setProposing(true)} />
      </div>

      <ProposeSwapDialog person={person} open={proposing} onOpenChange={setProposing} />
    </Card>
  );
}

export function PersonMeta({ location, organization }: { location: string | null; organization: string | null }) {
  if (!location && !organization) return null;
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
      {location && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          {location}
        </span>
      )}
      {organization && (
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="size-3.5" aria-hidden />
          {organization}
        </span>
      )}
    </p>
  );
}

const CADENCES = ["Weekly, 45 minutes each", "Weekly, 1 hour each", "Every two weeks", "Flexible, we'll figure it out"];

export function ProposeSwapDialog({ person, open, onOpenChange }: { person: Pick<PersonCard, "id" | "full_name" | "teaches" | "they_teach" | "they_want">; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = usePerson(open ? user?.id : undefined);
  const myTeaches = me.data?.teaches ?? [];

  const [offered, setOffered] = useState("");
  const [requested, setRequested] = useState("");
  const [message, setMessage] = useState("");
  const [cadence, setCadence] = useState(CADENCES[0]);
  const [error, setError] = useState<string | null>(null);

  // Preselect the overlap whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setRequested((person.they_teach[0] ?? person.teaches[0])?.id ?? "");
  }, [open, person]);
  useEffect(() => {
    if (!open || !myTeaches.length) return;
    setOffered((current) => current || (person.they_want.find((s) => myTeaches.some((m) => m.id === s.id)) ?? myTeaches[0]).id);
  }, [open, myTeaches, person.they_want]);

  const propose = useAction(api.proposeSwap, {
    invalidate: ["swaps", "matches"],
    onSuccess: () => {
      toast.success(`Proposal sent to ${firstName(person.full_name)}`, { description: "You'll be notified when they answer." });
      onOpenChange(false);
      setMessage("");
      navigate("/swaps");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offered || !requested) return setError("Choose a skill on each side.");
    if (offered === requested) return setError("Choose two different skills.");
    setError(null);
    propose.mutate({ recipient: person.id, offered, requested, message, cadence });
  };

  const theirName = firstName(person.full_name);
  const wanted = new Set(person.they_want.map((s) => s.id));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Propose a swap with ${theirName}`}
      description="Pick one skill each way. Chat opens once they accept."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="propose-swap" loading={propose.isPending} disabled={me.isPending || myTeaches.length === 0}>
            Send proposal
          </Button>
        </>
      }
    >
      {me.isSuccess && myTeaches.length === 0 ? (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Add at least one skill you can teach before proposing a swap. A swap goes both ways.</p>
          <ButtonLink to="/profile" variant="secondary" size="sm">
            Add a skill to teach
          </ButtonLink>
        </div>
      ) : (
        <form id="propose-swap" onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="You teach" value={offered} onChange={(e) => setOffered(e.target.value)} disabled={me.isPending}>
              {myTeaches.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {wanted.has(s.id) ? " (they want this)" : ""}
                </option>
              ))}
            </SelectField>
            <SelectField label={`${theirName} teaches`} value={requested} onChange={(e) => setRequested(e.target.value)}>
              {person.teaches.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>
          <SelectField label="Rhythm" value={cadence} onChange={(e) => setCadence(e.target.value)} hint="A starting point. You'll agree exact times in the swap.">
            {CADENCES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectField>
          <TextArea
            label="Message"
            optional
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            placeholder={`Hi ${theirName}, I'd like to learn from you because…`}
          />
          <FormError>{error}</FormError>
        </form>
      )}
    </Modal>
  );
}

export function ReportDialog({ personId, personName, open, onOpenChange }: { personId: string; personName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const report = useAction(() => api.reportUser(personId, reason, details), {
    success: "Report sent. Thank you for telling us.",
    onSuccess: () => {
      onOpenChange(false);
      setDetails("");
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Report ${personName}`}
      description="Reports are private. The person is not told who reported them."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={report.isPending} onClick={() => report.mutate(undefined)}>
            Send report
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField label="What's wrong?" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>
        <TextArea label="Details" optional value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Anything that helps us understand what happened." />
      </div>
    </Modal>
  );
}
