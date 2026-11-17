import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Flag, MoreHorizontal, UserX } from "lucide-react";
import { Button, Card, EmptyState, LoadError, Page, Spinner, SwapStrip } from "@/components/kit";
import { ConfirmDialog } from "@/components/modal";
import { ProposeSwapDialog, ReportDialog, SwapAction } from "@/components/people";
import { ProfileView } from "@/components/profile-view";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as api from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useDocumentTitle, usePerson } from "@/lib/hooks";
import { displayName, firstName, isUuid } from "@/lib/utils";

export default function PersonPage() {
  const { id } = useParams();
  const { user } = useMe();
  const navigate = useNavigate();
  const person = usePerson(id);
  const [dialog, setDialog] = useState<"propose" | "report" | "block" | null>(null);
  useDocumentTitle(person.data ? displayName(person.data.full_name) : "Profile");

  const block = useAction(() => api.blockUser(id!), {
    invalidate: ["person", "matches", "explore", "swaps", "sessions", "blocked", "notifications"],
    success: "Blocked. They can no longer contact you.",
    onSuccess: () => setDialog(null),
  });
  const unblock = useAction(() => api.unblockUser(id!), { invalidate: ["person", "matches", "explore", "blocked"], success: "Unblocked" });

  if (id === user.id) return <Navigate to="/profile" replace />;

  const back = (
    <Button variant="ghost" size="sm" className="-ml-2 mb-3" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/discover"))}>
      <ArrowLeft /> Back
    </Button>
  );

  if (!isUuid(id) || (person.isSuccess && !person.data)) {
    return (
      <Page width="narrow">
        {back}
        <EmptyState icon={UserX} title="This profile isn't available">
          The person may have hidden their profile or closed their account.
        </EmptyState>
      </Page>
    );
  }
  if (person.isPending) return <Page width="narrow"><Spinner /></Page>;
  if (person.isError || !person.data) return <Page width="narrow">{back}<LoadError error={person.error} retry={person.refetch} /></Page>;

  const p = person.data;
  const name = firstName(p.full_name);
  const twoWay = p.they_teach.length > 0 && p.they_want.length > 0;

  return (
    <Page width="narrow">
      {back}
      {p.blocked_by_me && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-raised px-4 py-3 text-sm text-muted-foreground">
          You've blocked {name}. They can't see you in Discover or propose swaps.
          <Button variant="secondary" size="sm" loading={unblock.isPending} onClick={() => unblock.mutate(undefined)}>
            Unblock
          </Button>
        </div>
      )}
      {twoWay && !p.blocked_by_me && (
        <Card className="mb-4 space-y-3 p-5">
          <p className="text-sm font-medium">You and {name} are a two-way match</p>
          <SwapStrip teach={p.they_want.map((s) => s.name).join(", ")} learn={p.they_teach.map((s) => s.name).join(", ")} />
        </Card>
      )}
      <ProfileView
        person={p}
        actions={
          <>
            {!p.blocked_by_me && <SwapAction person={p} onPropose={() => setDialog("propose")} />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label={`More actions for ${name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuItem onSelect={() => setDialog("report")} className="min-h-10">
                  <Flag /> Report
                </DropdownMenuItem>
                {!p.blocked_by_me && (
                  <DropdownMenuItem onSelect={() => setDialog("block")} className="min-h-10">
                    <Ban /> Block
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      <ProposeSwapDialog person={p} open={dialog === "propose"} onOpenChange={(o) => setDialog(o ? "propose" : null)} />
      <ReportDialog personId={p.id} personName={name} open={dialog === "report"} onOpenChange={(o) => setDialog(o ? "report" : null)} />
      <ConfirmDialog
        open={dialog === "block"}
        onOpenChange={(o) => setDialog(o ? "block" : null)}
        title={`Block ${name}?`}
        description="Any open swap with them ends and its sessions are cancelled. They won't see you in Discover and can't propose swaps. You can unblock them in Settings."
        confirmLabel="Block"
        danger
        loading={block.isPending}
        onConfirm={() => block.mutate(undefined)}
      />
    </Page>
  );
}
