export type WebTargetKind = "identity" | "files" | "directory" | "forms" | "api" | "report" | "upload" | "content";
export type WebTargetLayout = "ledger" | "editorial" | "canvas" | "terminal" | "portal" | "dashboard" | "library" | "minimal" | "board" | "studio";
export type WebTargetScene = "mesh" | "radar" | "rain" | "circuit" | "breach" | "packets" | "cipher" | "orbit" | "vault" | "void";

export type WebTargetVisual = {
  signature: string;
  layout: WebTargetLayout;
  hue: number;
  density: "compact" | "balanced" | "spacious";
  type: "sans" | "serif" | "mono";
  navigation: "rail" | "tabs" | "topbar" | "quiet";
  scene: WebTargetScene;
  scenePhase: number;
  sceneOffset: number;
};

export type WebTargetSpec = {
  id: number;
  appName: string;
  origin: string;
  kind: WebTargetKind;
  route: string;
  heading: string;
  description: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  actionLabel: string;
  tiles: readonly string[];
};

const targets: readonly WebTargetSpec[] = [
  { id: 1, appName: "Northstar Identity", origin: "identity.northstar.local", kind: "identity", route: "/signin", heading: "Welcome back", description: "Use your organization account to continue.", fieldLabel: "Access reference", fieldPlaceholder: "reference", actionLabel: "Continue", tiles: ["Single sign-on", "Account recovery", "Session activity"] },
  { id: 2, appName: "Mosaic Files", origin: "files.mosaic.local", kind: "files", route: "/downloads", heading: "Release archive", description: "Browse public release packages and delivery details.", fieldLabel: "File reference", fieldPlaceholder: "document name", actionLabel: "Open file", tiles: ["Release notes", "Client installer", "Archive manifest"] },
  { id: 3, appName: "Civic Portal", origin: "portal.civic.local", kind: "directory", route: "/account", heading: "Your account", description: "Review the account profile currently active in this browser.", fieldLabel: "Profile reference", fieldPlaceholder: "account key", actionLabel: "Load profile", tiles: ["Profile", "Preferences", "Connected devices"] },
  { id: 4, appName: "Beacon Feedback", origin: "feedback.beacon.local", kind: "content", route: "/messages", heading: "Community messages", description: "Share a short update with the project team.", fieldLabel: "Message reference", fieldPlaceholder: "message token", actionLabel: "Preview message", tiles: ["Latest updates", "Team notices", "Saved drafts"] },
  { id: 5, appName: "Orbit Accounts", origin: "accounts.orbit.local", kind: "forms", route: "/join", heading: "Create an account", description: "Complete the onboarding form for a trial workspace.", fieldLabel: "Validation reference", fieldPlaceholder: "form key", actionLabel: "Validate details", tiles: ["Email rules", "Profile setup", "Terms"] },
  { id: 6, appName: "Relay Profile", origin: "profile.relay.local", kind: "forms", route: "/settings", heading: "Profile settings", description: "Update the visible details for your workspace account.", fieldLabel: "Change reference", fieldPlaceholder: "field key", actionLabel: "Save changes", tiles: ["Public name", "Notifications", "Security"] },
  { id: 7, appName: "Transit Desk", origin: "desk.transit.local", kind: "content", route: "/continue", heading: "Continue to service", description: "Select the destination for the next part of your visit.", fieldLabel: "Destination reference", fieldPlaceholder: "destination key", actionLabel: "Continue", tiles: ["Billing", "Help center", "Workspace"] },
  { id: 8, appName: "Archive One", origin: "archive.one.local", kind: "files", route: "/recent", heading: "Recent documents", description: "Review documents that were recently opened by this browser.", fieldLabel: "Archive reference", fieldPlaceholder: "cache key", actionLabel: "View record", tiles: ["Quarterly plan", "Operations memo", "Support export"] },
  { id: 9, appName: "Harbor Docs", origin: "docs.harbor.local", kind: "content", route: "/help", heading: "Documentation center", description: "Search product documentation and public help pages.", fieldLabel: "Path reference", fieldPlaceholder: "document path", actionLabel: "Open guide", tiles: ["Getting started", "Integration notes", "Search policy"] },
  { id: 10, appName: "Atlas Review", origin: "review.atlas.local", kind: "report", route: "/summary", heading: "Surface review", description: "Review the first batch of observations before closing the case.", fieldLabel: "Review reference", fieldPlaceholder: "case key", actionLabel: "Generate review", tiles: ["Identity", "Navigation", "Delivery"] },
  { id: 11, appName: "Quarry Search", origin: "search.quarry.local", kind: "api", route: "/search", heading: "Search the knowledge base", description: "Find published support answers using a topic query.", fieldLabel: "Search reference", fieldPlaceholder: "query key", actionLabel: "Search", tiles: ["Products", "Guides", "Changelog"] },
  { id: 12, appName: "Member Stack", origin: "members.stack.local", kind: "forms", route: "/profile", heading: "Member profile", description: "Maintain the profile details linked to your member record.", fieldLabel: "Request reference", fieldPlaceholder: "request key", actionLabel: "Update profile", tiles: ["Contact", "Address", "Preferences"] },
  { id: 13, appName: "Lumen Sessions", origin: "sessions.lumen.local", kind: "identity", route: "/home", heading: "Workspace home", description: "Open your active workspace using the current sign-in session.", fieldLabel: "Session reference", fieldPlaceholder: "session key", actionLabel: "Open workspace", tiles: ["Overview", "Notifications", "Sign out"] },
  { id: 14, appName: "Crest Console", origin: "console.crest.local", kind: "identity", route: "/security", heading: "Security center", description: "Review your active sessions and recent account activity.", fieldLabel: "Session reference", fieldPlaceholder: "duration key", actionLabel: "Review session", tiles: ["Active sessions", "Trusted devices", "Recovery"] },
  { id: 15, appName: "Pine Reports", origin: "reports.pine.local", kind: "report", route: "/home", heading: "Reporting home", description: "Select a report available to your assigned workspace.", fieldLabel: "Report reference", fieldPlaceholder: "report path", actionLabel: "Open report", tiles: ["Weekly overview", "Exports", "Saved views"] },
  { id: 16, appName: "Parcel Shelf", origin: "parcel.shelf.local", kind: "files", route: "/deliveries", heading: "Delivery center", description: "Review downloadable files from recent deliveries.", fieldLabel: "Delivery reference", fieldPlaceholder: "file metadata", actionLabel: "Inspect delivery", tiles: ["Invoices", "Receipts", "Packages"] },
  { id: 17, appName: "Dropbay", origin: "dropbay.local", kind: "upload", route: "/upload", heading: "Upload a file", description: "Send a document to your isolated project workspace.", fieldLabel: "Upload reference", fieldPlaceholder: "upload token", actionLabel: "Stage upload", tiles: ["Accepted formats", "Recent uploads", "Retention"] },
  { id: 18, appName: "Rulebook", origin: "rules.rulebook.local", kind: "forms", route: "/check", heading: "Request checker", description: "Verify a proposed request against the workspace rules.", fieldLabel: "Rule reference", fieldPlaceholder: "rule key", actionLabel: "Check request", tiles: ["Format", "Scope", "Ownership"] },
  { id: 19, appName: "Helpdesk Relay", origin: "help.relay.local", kind: "api", route: "/tickets", heading: "Support request", description: "Look up a support request using its public reference.", fieldLabel: "Ticket reference", fieldPlaceholder: "error key", actionLabel: "Find ticket", tiles: ["Open tickets", "Known issues", "Status"] },
  { id: 20, appName: "Request Ledger", origin: "ledger.request.local", kind: "report", route: "/review", heading: "Request review", description: "Open the case review for the current request boundary.", fieldLabel: "Ledger reference", fieldPlaceholder: "review key", actionLabel: "Open review", tiles: ["Requests", "Sessions", "Responses"] },
  { id: 21, appName: "Canvas Notes", origin: "notes.canvas.local", kind: "content", route: "/compose", heading: "Compose a note", description: "Draft a team note for a shared project space.", fieldLabel: "Content reference", fieldPlaceholder: "context key", actionLabel: "Preview note", tiles: ["Drafts", "Published", "Templates"] },
  { id: 22, appName: "Plaintext Feed", origin: "feed.plaintext.local", kind: "content", route: "/status", heading: "Status update", description: "Read the latest project status from the operations feed.", fieldLabel: "Text reference", fieldPlaceholder: "encoding key", actionLabel: "Read update", tiles: ["Live status", "History", "Subscriptions"] },
  { id: 23, appName: "Library Lens", origin: "library.lens.local", kind: "api", route: "/catalog", heading: "Catalog search", description: "Search a curated catalog of public reference material.", fieldLabel: "Search reference", fieldPlaceholder: "query shape", actionLabel: "Run search", tiles: ["Catalog", "Authors", "Collections"] },
  { id: 24, appName: "Metric Board", origin: "metrics.board.local", kind: "report", route: "/dashboard", heading: "Team metrics", description: "Choose a prepared view for the current reporting window.", fieldLabel: "View reference", fieldPlaceholder: "sort key", actionLabel: "Load view", tiles: ["Overview", "Trends", "Exports"] },
  { id: 25, appName: "Document Dock", origin: "dock.document.local", kind: "files", route: "/library", heading: "Document library", description: "Open a document from the shared library.", fieldLabel: "Document reference", fieldPlaceholder: "document key", actionLabel: "Open document", tiles: ["Policies", "Templates", "Project files"] },
  { id: 26, appName: "Intake Room", origin: "intake.room.local", kind: "upload", route: "/new", heading: "New intake", description: "Prepare a file for isolated review by the project team.", fieldLabel: "Intake reference", fieldPlaceholder: "policy key", actionLabel: "Prepare intake", tiles: ["Upload policy", "Review queue", "History"] },
  { id: 27, appName: "Case Messenger", origin: "case.messenger.local", kind: "forms", route: "/new", heading: "Create a case", description: "Create a support case using a short public summary.", fieldLabel: "Case reference", fieldPlaceholder: "report key", actionLabel: "Create case", tiles: ["New case", "My cases", "Guidelines"] },
  { id: 28, appName: "Pocket Preferences", origin: "prefs.pocket.local", kind: "directory", route: "/settings", heading: "Application preferences", description: "Review the preferences stored for this browser session.", fieldLabel: "Preference reference", fieldPlaceholder: "storage key", actionLabel: "Open preference", tiles: ["Appearance", "Accessibility", "Storage"] },
  { id: 29, appName: "Flow Desk", origin: "flow.desk.local", kind: "forms", route: "/request", heading: "Request intake", description: "Submit a request for the operations review queue.", fieldLabel: "Flow reference", fieldPlaceholder: "input key", actionLabel: "Submit request", tiles: ["New request", "Queue", "Guidelines"] },
  { id: 30, appName: "Data Compass", origin: "compass.data.local", kind: "report", route: "/case", heading: "Data boundary review", description: "Open the combined review for this data-handling case.", fieldLabel: "Case reference", fieldPlaceholder: "boundary key", actionLabel: "Open case", tiles: ["Inputs", "Queries", "Delivery"] },
  { id: 31, appName: "Recordspace", origin: "records.space.local", kind: "directory", route: "/records", heading: "My records", description: "Open a record that belongs to your current workspace.", fieldLabel: "Record reference", fieldPlaceholder: "record id", actionLabel: "Open record", tiles: ["Recent", "Assigned", "Archived"] },
  { id: 32, appName: "Teamlist", origin: "teamlist.local", kind: "directory", route: "/members", heading: "Team directory", description: "Find a member in the active project directory.", fieldLabel: "Member reference", fieldPlaceholder: "member id", actionLabel: "Find member", tiles: ["People", "Groups", "Invitations"] },
  { id: 33, appName: "Approvals Hub", origin: "approvals.hub.local", kind: "forms", route: "/request", heading: "Approval request", description: "Submit a request for a protected workspace action.", fieldLabel: "Approval reference", fieldPlaceholder: "authorization key", actionLabel: "Request approval", tiles: ["Pending", "History", "Policies"] },
  { id: 34, appName: "Switchboard", origin: "switchboard.local", kind: "identity", route: "/account", heading: "Account switcher", description: "Review the active organization context for this session.", fieldLabel: "Account reference", fieldPlaceholder: "refresh key", actionLabel: "Switch context", tiles: ["Organizations", "Permissions", "Devices"] },
  { id: 35, appName: "Token Room", origin: "tokens.room.local", kind: "api", route: "/keys", heading: "API key center", description: "Review API access records for the current workspace.", fieldLabel: "Token reference", fieldPlaceholder: "token key", actionLabel: "Inspect token", tiles: ["Active keys", "Usage", "Rotation"] },
  { id: 36, appName: "Endpoint Atlas", origin: "api.atlas.local", kind: "api", route: "/reference", heading: "API reference", description: "Browse the documented response fields for a product endpoint.", fieldLabel: "Endpoint reference", fieldPlaceholder: "field set", actionLabel: "Load endpoint", tiles: ["Resources", "Schemas", "Examples"] },
  { id: 37, appName: "Sign-in Gate", origin: "gate.signin.local", kind: "identity", route: "/login", heading: "Secure sign in", description: "Enter your workspace details to access the portal.", fieldLabel: "Attempt reference", fieldPlaceholder: "rate key", actionLabel: "Sign in", tiles: ["Sign in", "Recovery", "Security"] },
  { id: 38, appName: "Auditstream", origin: "audit.stream.local", kind: "report", route: "/events", heading: "Activity viewer", description: "Browse project events recorded during the current period.", fieldLabel: "Event reference", fieldPlaceholder: "event key", actionLabel: "View event", tiles: ["Events", "Filters", "Exports"] },
  { id: 39, appName: "Policy Grid", origin: "policy.grid.local", kind: "directory", route: "/matrix", heading: "Access matrix", description: "Review available actions for the active workspace role.", fieldLabel: "Policy reference", fieldPlaceholder: "matrix key", actionLabel: "Review policy", tiles: ["Roles", "Actions", "Exceptions"] },
  { id: 40, appName: "Privilege Report", origin: "privilege.report.local", kind: "report", route: "/summary", heading: "Privilege summary", description: "Open the final access review for this workspace.", fieldLabel: "Review reference", fieldPlaceholder: "report key", actionLabel: "Open summary", tiles: ["Access", "Tokens", "API"] },
  { id: 41, appName: "Evidence Notes", origin: "evidence.notes.local", kind: "content", route: "/case", heading: "Case notebook", description: "Collect only supported observations for the current case.", fieldLabel: "Evidence reference", fieldPlaceholder: "fact key", actionLabel: "Open note", tiles: ["Facts", "Open questions", "Sources"] },
  { id: 42, appName: "Signal Queue", origin: "queue.signal.local", kind: "report", route: "/triage", heading: "Triage queue", description: "Review signals awaiting an analyst decision.", fieldLabel: "Signal reference", fieldPlaceholder: "priority key", actionLabel: "Review signal", tiles: ["New", "Investigating", "Resolved"] },
  { id: 43, appName: "Login Trail", origin: "trail.login.local", kind: "identity", route: "/history", heading: "Sign-in history", description: "Review the authorization path for a recent account session.", fieldLabel: "Trail reference", fieldPlaceholder: "flow key", actionLabel: "Open trail", tiles: ["Sign-ins", "Resources", "Permissions"] },
  { id: 44, appName: "Template Shelf", origin: "templates.shelf.local", kind: "content", route: "/preview", heading: "Template preview", description: "Preview a shared template before publishing it to the team.", fieldLabel: "Template reference", fieldPlaceholder: "output key", actionLabel: "Preview template", tiles: ["Templates", "Drafts", "Published"] },
  { id: 45, appName: "Delivery Chain", origin: "delivery.chain.local", kind: "files", route: "/files", heading: "File delivery", description: "Track a file from intake to the delivery queue.", fieldLabel: "Delivery reference", fieldPlaceholder: "lifecycle key", actionLabel: "Track delivery", tiles: ["Intake", "Review", "Delivery"] },
  { id: 46, appName: "Contract API", origin: "contract.api.local", kind: "api", route: "/workspace", heading: "API workspace", description: "Review an API operation before sending a workspace request.", fieldLabel: "Contract reference", fieldPlaceholder: "contract key", actionLabel: "Inspect operation", tiles: ["Inputs", "Authorization", "Response"] },
  { id: 47, appName: "Disclosure Desk", origin: "disclosure.desk.local", kind: "forms", route: "/report", heading: "Security report", description: "Prepare a concise issue report for the security team.", fieldLabel: "Disclosure reference", fieldPlaceholder: "finding key", actionLabel: "Prepare report", tiles: ["Impact", "Evidence", "Mitigation"] },
  { id: 48, appName: "Layerboard", origin: "layers.board.local", kind: "report", route: "/posture", heading: "Protection posture", description: "Review the control layers applied to this service.", fieldLabel: "Control reference", fieldPlaceholder: "layer key", actionLabel: "Review controls", tiles: ["Prevention", "Detection", "Recovery"] },
  { id: 49, appName: "Evidence Pack", origin: "pack.evidence.local", kind: "files", route: "/bundle", heading: "Case bundle", description: "Open the evidence bundle prepared for final review.", fieldLabel: "Bundle reference", fieldPlaceholder: "scope key", actionLabel: "Open bundle", tiles: ["Evidence", "Assumptions", "Conclusion"] },
  { id: 50, appName: "Boundary Planner", origin: "planner.boundary.local", kind: "report", route: "/plan", heading: "Final protection plan", description: "Review the final cross-boundary protection plan.", fieldLabel: "Plan reference", fieldPlaceholder: "plan key", actionLabel: "Open plan", tiles: ["Inputs", "Access", "Responses"] },
];

const targetLayouts: readonly WebTargetLayout[] = ["ledger", "editorial", "canvas", "terminal", "portal", "dashboard", "library", "minimal", "board", "studio"];
const targetScenes: readonly WebTargetScene[] = ["mesh", "radar", "rain", "circuit", "breach", "packets", "cipher", "orbit", "vault", "void"];
const typeScales: readonly WebTargetVisual["type"][] = ["sans", "serif", "mono", "sans", "serif"];
const densityScales: readonly WebTargetVisual["density"][] = ["compact", "balanced", "spacious", "balanced", "compact"];
const navigationStyles: readonly WebTargetVisual["navigation"][] = ["rail", "tabs", "topbar", "quiet", "tabs"];

export function webTargetForNode(id: number) {
  return targets.find(target => target.id === id) ?? null;
}

/** Every node receives a deterministic, unique visual fingerprint rather than inheriting a shared app shell. */
export function webTargetVisualForNode(id: number): WebTargetVisual | null {
  if (!webTargetForNode(id)) return null;
  const index = id - 1;
  return {
    signature: `target-${String(id).padStart(2, "0")}`,
    layout: targetLayouts[index % targetLayouts.length]!,
    // 47 and 360 are coprime, so these 50 nodes never repeat their primary hue.
    hue: (197 + index * 47) % 360,
    density: densityScales[(index * 2 + Math.floor(index / 5)) % densityScales.length]!,
    type: typeScales[(index + Math.floor(index / 10)) % typeScales.length]!,
    navigation: navigationStyles[(index * 3 + Math.floor(index / 2)) % navigationStyles.length]!,
    scene: targetScenes[index % targetScenes.length]!,
    scenePhase: (index * 67) % 360,
    sceneOffset: (index * 29) % 97,
  };
}

export const webTargets = targets;
