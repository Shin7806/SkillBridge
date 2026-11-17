import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Megaphone, Plus, Search, SearchX, Users } from "lucide-react";
import { Avatar, Button, ButtonLink, Card, EmptyState, FormError, LoadError, Page, PageHeader, SelectField, SkeletonCards, SkillChip, TextArea } from "@/components/kit";
import { Modal } from "@/components/modal";
import { PersonCardView } from "@/components/people";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as api from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useAsks, useCategories, useDebounced, useDocumentTitle, useExplore, useMatches, usePerson, useSkills } from "@/lib/hooks";
import { cn, displayName, formatDay, timeAgo } from "@/lib/utils";

const GRID = "grid gap-4 md:grid-cols-2";

function Matches() {
  const matches = useMatches();
  if (matches.isPending) return <SkeletonCards count={4} className={GRID} />;
  if (matches.isError) return <LoadError error={matches.error} retry={matches.refetch} />;

  const twoWay = matches.data.filter((m) => m.kind === "two_way");
  const oneWay = matches.data.filter((m) => m.kind !== "two_way");

  if (matches.data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No matches yet"
        action={
          <>
            <ButtonLink to="/me" variant="secondary" size="sm">
              Edit my skills
            </ButtonLink>
            <ButtonLink to="/discover?tab=explore" size="sm">
              Browse everyone
            </ButtonLink>
          </>
        }
      >
        Nobody's skills overlap with yours right now. Adding more skills widens the net, and new members are matched to you automatically.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="two-way">
        <h2 id="two-way" className="font-sans text-base font-semibold tracking-normal">
          Two-way matches <span className="font-normal text-muted-foreground">· {twoWay.length}</span>
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">They teach something you want, and want something you teach.</p>
        {twoWay.length ? (
          <div className={GRID}>
            {twoWay.map((p) => (
              <PersonCardView key={p.id} person={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            Nobody fits in both directions yet. The people below fit in one, and you can still propose a swap with any of them.
          </p>
        )}
      </section>
      {oneWay.length > 0 && (
        <section aria-labelledby="one-way">
          <h2 id="one-way" className="font-sans text-base font-semibold tracking-normal">
            One-way matches <span className="font-normal text-muted-foreground">· {oneWay.length}</span>
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">A fit in one direction. Offer one of your other skills in return.</p>
          <div className={GRID}>
            {oneWay.map((p) => (
              <PersonCardView key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const term = useDebounced(query.trim(), 300);
  const categories = useCategories();
  const people = useExplore(term, category);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by skill or name, e.g. Python"
          aria-label="Search people by skill or name"
          className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter by category">
        {[{ id: null as string | null, name: "All" }, ...(categories.data ?? [])].map((c) => (
          <button
            key={c.id ?? "all"}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors",
              category === c.id ? "bg-foreground text-background" : "bg-raised text-muted-foreground hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {people.isPending ? (
        <SkeletonCards count={4} className={GRID} />
      ) : people.isError ? (
        <LoadError error={people.error} retry={people.refetch} />
      ) : people.data.length === 0 ? (
        <EmptyState icon={SearchX} title="Nobody teaches that yet" action={<ButtonLink to="/discover?tab=asks" size="sm">Post an Ask</ButtonLink>}>
          Try a broader search or another category. You can also post an Ask so the right person finds you.
        </EmptyState>
      ) : (
        <div className={cn(GRID, people.isPlaceholderData && "opacity-60")} aria-busy={people.isPlaceholderData}>
          {people.data.map((p) => (
            <PersonCardView key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function AskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useMe();
  const skills = useSkills();
  const me = usePerson(open ? user.id : undefined);
  const [wanted, setWanted] = useState("");
  const [offered, setOffered] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useAction(api.createAsk, {
    invalidate: ["asks"],
    success: "Your Ask is live for 30 days",
    onSuccess: () => {
      onOpenChange(false);
      setBody("");
      setWanted("");
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!wanted) return setError("Choose the skill you need help with.");
    if (body.trim().length < 10) return setError("Add a sentence about what you need.");
    setError(null);
    create.mutate({ authorId: user.id, wanted, offered: offered || null, body });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Post an Ask"
      description="A short, specific request. People who can help will see it in Discover."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="ask-form" loading={create.isPending}>
            Post Ask
          </Button>
        </>
      }
    >
      <form id="ask-form" onSubmit={submit} className="space-y-4">
        <SelectField label="I want to learn" value={wanted} onChange={(e) => setWanted(e.target.value)} disabled={skills.isPending}>
          <option value="">Choose a skill</option>
          {(skills.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="In return I can teach" optional value={offered} onChange={(e) => setOffered(e.target.value)}>
          <option value="">Open to suggestions</option>
          {(me.data?.teaches ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextArea label="What do you need?" value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="I have a React interview on Friday and want to practise hooks with someone." />
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}

function Asks() {
  const { user } = useMe();
  const asks = useAsks();
  const [posting, setPosting] = useState(false);
  const close = useAction(api.closeAsk, { invalidate: ["asks"], success: "Ask closed" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-muted-foreground">Specific requests from members. If you can help with one, open their profile and propose a swap.</p>
        <Button size="sm" onClick={() => setPosting(true)}>
          <Plus /> Post an Ask
        </Button>
      </div>

      {asks.isPending ? (
        <SkeletonCards count={3} />
      ) : asks.isError ? (
        <LoadError error={asks.error} retry={asks.refetch} />
      ) : asks.data.filter((a) => a.status === "open").length === 0 ? (
        <EmptyState icon={Megaphone} title="No open Asks" action={<Button size="sm" onClick={() => setPosting(true)}>Post the first one</Button>}>
          Need help with something specific and soon? Post it here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {asks.data
            .filter((a) => a.status === "open")
            .map((ask) => {
              const mine = ask.author_id === user.id;
              return (
                <Card as="li" key={ask.id} className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={ask.author?.full_name} src={ask.author?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium">{mine ? "You" : displayName(ask.author?.full_name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(ask.created_at)} · open until {formatDay(ask.expires_at)}
                      </p>
                    </div>
                  </div>
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    Wants to learn <SkillChip tone="learn">{ask.wanted?.name ?? "a skill"}</SkillChip>
                    {ask.offered && (
                      <>
                        and can teach <SkillChip tone="teach">{ask.offered.name}</SkillChip>
                      </>
                    )}
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{ask.body}</p>
                  <div className="flex justify-end">
                    {mine ? (
                      <Button variant="secondary" size="sm" loading={close.isPending && close.variables === ask.id} onClick={() => close.mutate(ask.id)}>
                        Close Ask
                      </Button>
                    ) : ask.author ? (
                      <ButtonLink to={`/people/${ask.author_id}`} size="sm">
                        Offer to help
                      </ButtonLink>
                    ) : (
                      <span className="text-xs text-muted-foreground">Profile hidden</span>
                    )}
                  </div>
                </Card>
              );
            })}
        </ul>
      )}
      <AskDialog open={posting} onOpenChange={setPosting} />
    </div>
  );
}

const TABS = ["matches", "explore", "asks"] as const;

export default function Discover() {
  useDocumentTitle("Discover");
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t === params.get("tab")) ?? "matches";

  return (
    <Page width="wide">
      <PageHeader title="Discover" description="People whose skills fit yours, everyone else, and open requests." action={<Link to="/me" className="text-sm text-primary hover:underline">Edit my skills</Link>} />
      <Tabs value={tab} onValueChange={(v) => setParams(v === "matches" ? {} : { tab: v }, { replace: true })} className="gap-6">
        <TabsList className="h-11 w-full rounded-xl bg-raised p-1 sm:w-fit">
          {[
            ["matches", "Matches"],
            ["explore", "Explore"],
            ["asks", "Asks"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="h-9 flex-1 rounded-lg px-5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground sm:flex-none">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="matches">
          <Matches />
        </TabsContent>
        <TabsContent value="explore">
          <Explore />
        </TabsContent>
        <TabsContent value="asks">
          <Asks />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
