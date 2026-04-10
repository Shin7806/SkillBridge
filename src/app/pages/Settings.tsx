import { useState } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/Card";
import { Bell, Lock, Globe, Mail, Shield, Trash2 } from "lucide-react";

export default function Settings() {
  const user = useCurrentUser();

  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailSessions: true,
    emailRequests: false,
    pushMessages: true,
    pushSessions: true,
    pushRequests: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showLocation: true,
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Email" type="email" value={user?.email ?? ""} disabled />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Change Password
              </label>
              <div className="space-y-3">
                <Input type="password" placeholder="Current password" />
                <Input type="password" placeholder="New password" />
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <Button variant="outline" className="mt-3">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Email Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-foreground">New messages</span>
                  <input
                    type="checkbox"
                    checked={notifications.emailMessages}
                    onChange={(e) =>
                      setNotifications({ ...notifications, emailMessages: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-foreground">Session reminders</span>
                  <input
                    type="checkbox"
                    checked={notifications.emailSessions}
                    onChange={(e) =>
                      setNotifications({ ...notifications, emailSessions: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-foreground">Skill requests</span>
                  <input
                    type="checkbox"
                    checked={notifications.emailRequests}
                    onChange={(e) =>
                      setNotifications({ ...notifications, emailRequests: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Push Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-foreground">New messages</span>
                  <input
                    type="checkbox"
                    checked={notifications.pushMessages}
                    onChange={(e) =>
                      setNotifications({ ...notifications, pushMessages: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-foreground">Session reminders</span>
                  <input
                    type="checkbox"
                    checked={notifications.pushSessions}
                    onChange={(e) =>
                      setNotifications({ ...notifications, pushSessions: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-foreground">Skill requests</span>
                  <input
                    type="checkbox"
                    checked={notifications.pushRequests}
                    onChange={(e) =>
                      setNotifications({ ...notifications, pushRequests: e.target.checked })
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            <Button variant="primary">Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              <CardTitle>Privacy</CardTitle>
            </div>
            <CardDescription>Control your privacy preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Public Profile</p>
                <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.profileVisible}
                onChange={(e) =>
                  setPrivacy({ ...privacy, profileVisible: e.target.checked })
                }
                className="rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Email</p>
                <p className="text-sm text-muted-foreground">Display email on your profile</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showEmail}
                onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Show Location</p>
                <p className="text-sm text-muted-foreground">Display your location on your profile</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showLocation}
                onChange={(e) =>
                  setPrivacy({ ...privacy, showLocation: e.target.checked })
                }
                className="rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <Button variant="primary">Save Privacy Settings</Button>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              <CardTitle>Language & Region</CardTitle>
            </div>
            <CardDescription>Set your language and timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Language
              </label>
              <select className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Mandarin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Timezone
              </label>
              <select className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>Pacific Time (PT)</option>
                <option>Mountain Time (MT)</option>
                <option>Central Time (CT)</option>
                <option>Eastern Time (ET)</option>
              </select>
            </div>

            <Button variant="primary">Save Settings</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card variant="bordered" className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="size-5 text-red-600" />
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
