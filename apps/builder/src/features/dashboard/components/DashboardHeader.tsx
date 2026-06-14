import { useTranslate } from "@tolgee/react";
import { isNotDefined } from "@typebot.io/lib/utils";
import { Button } from "@typebot.io/ui/components/Button";
import { EmojiOrImageIcon } from "@typebot.io/ui/components/EmojiOrImageIcon";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { HardDriveIcon } from "@typebot.io/ui/icons/HardDriveIcon";
import { UsersIcon } from "@typebot.io/ui/icons/UsersIcon";
import { Settings01Icon } from "@typebot.io/ui/icons/Settings01Icon";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useUser } from "@/features/user/hooks/useUser";
import { WorkspaceDropdown } from "@/features/workspace/components/WorkspaceDropdown";
import { WorkspaceSettingsDialog } from "@/features/workspace/components/WorkspaceSettingsDialog";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";

export const DashboardHeader = () => {
  const { t } = useTranslate();
  const { user, logOut } = useUser();
  const { workspace, switchWorkspace, createWorkspace } = useWorkspace();
  const { asPath } = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isRedirectFromCredentialsCreation = asPath.includes("credentials");

  const { isOpen, onOpen, onClose } = useOpenControls({
    defaultIsOpen: isRedirectFromCredentialsCreation,
  });

  const handleCreateNewWorkspace = () =>
    createWorkspace(user?.name ?? undefined);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logOut();
  };

  return (
    <div className="flex w-full border-b justify-center bg-gray-1 dark:bg-gray-2">
      <div className="flex justify-between items-center h-16 flex-1 max-w-[1000px]">
        <Link href="/chatbots" data-testid="typebot-logo">
          <EmojiOrImageIcon
            icon={workspace?.icon}
            className="size-6.25 text-2xl"
            defaultIcon={<HardDriveIcon className="size-full" />}
          />
        </Link>
        <div className="flex items-center gap-2">
          {user && workspace && !workspace.isPastDue && (
            <WorkspaceSettingsDialog
              isOpen={isOpen}
              onClose={onClose}
              user={user}
              workspace={workspace}
              defaultTab={
                isRedirectFromCredentialsCreation ? "credentials" : undefined
              }
            />
          )}
          {!workspace?.isPastDue && (
            <Button
              variant="secondary"
              onClick={onOpen}
              disabled={isNotDefined(workspace) || isLoggingOut}
            >
              <Settings01Icon />
              {t("dashboard.header.settingsButton.label")}
            </Button>
          )}
          {workspace?.id && !workspace.isPastDue && (
            <Link
              href={`/w/${workspace.id}/settings/organization`}
              className="inline-flex items-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium bg-gray-3 hover:bg-gray-4 active:bg-gray-5 cursor-pointer select-none whitespace-nowrap transition-colors"
            >
              <UsersIcon className="size-4" />
              Organization
            </Link>
          )}
          <WorkspaceDropdown
            isLoggingOut={isLoggingOut}
            currentWorkspace={workspace}
            onLogoutClick={handleLogout}
            onCreateNewWorkspaceClick={handleCreateNewWorkspace}
            onWorkspaceSelected={switchWorkspace}
          />
        </div>
      </div>
    </div>
  );
};
