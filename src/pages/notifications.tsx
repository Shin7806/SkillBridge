import { useNavigate } from "react-router-dom";
import { BellOff } from "lucide-react";
import { Avatar, Button, EmptyState, LoadError, Page, PageHeader, Spinner } from "@/components/kit";
import { markNotificationsRead } from "@/lib/api";
import { describeNotification, useAction, useDocumentTitle, useNotifications } from "@/lib/hooks";
import { cn, timeAgo } from "@/lib/utils";

/** Used by both the bell popover and the full page. */
export function NotificationList({ limit, compact, onNavigate }: { limit?: number; compact?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const markRead = useAction((ids: string[]) => markNotificationsRead(ids), { invalidate: ["notifications"] });

  if (notifications.isPending) return <Spinner />;
  if (notifications.isError) return <div className="p-3"><LoadError error={notifications.error} retry={notifications.refetch} /></div>;

  const items = limit ? notifications.data.slice(0, limit) : notifications.data;
  if (items.length === 0) {
    return compact ? (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing yet. Proposals, messages and session updates show up here.</p>
    ) : (
      <EmptyState icon={BellOff} title="No notifications yet">
        Proposals, messages and session updates show up here.
      </EmptyState>
    );
  }

  return (
    <ul className={cn(!compact && "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card")}>
      {items.map((n) => {
        const { who, text, href } = describeNotification(n);
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => {
                if (!n.read_at) markRead.mutate([n.id]);
                onNavigate?.();
                navigate(href);
              }}
              className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60", !n.read_at && "bg-primary/[0.04]")}
            >
              <Avatar name={n.actor?.full_name} src={n.actor?.avatar_url} size="sm" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{who}</span> <span className="text-muted-foreground">{text}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
              </span>
              {!n.read_at && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                  <span className="sr-only">Unread</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Notifications() {
  useDocumentTitle("Notifications");
  const { data } = useNotifications();
  const unread = (data ?? []).some((n) => !n.read_at);
  const markAll = useAction(() => markNotificationsRead(), { invalidate: ["notifications"], success: "All caught up" });

  return (
    <Page width="narrow">
      <PageHeader
        title="Notifications"
        action={
          unread ? (
            <Button variant="secondary" size="sm" loading={markAll.isPending} onClick={() => markAll.mutate(undefined)}>
              Mark all read
            </Button>
          ) : undefined
        }
      />
      <NotificationList />
    </Page>
  );
}
