"use client";

import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Key } from "lucide-react";
import { useState } from "react";
import { EditApiKeyDialog, RotatedKeyDialog } from "./api-key-dialogs";
import { ApiKeyItem } from "./api-key-item";
import { ApiKeyListSkeleton, EmptyApiKeyState } from "./api-key-skeleton";
import type {
  ApiKeyData,
  EditingKeyData,
  RotatedKeyData,
} from "./api-key-types";
import { CreateApiKeyDialog } from "./create-api-key-dialog";

// ============================================================================
// Types
// ============================================================================

type ApiKeyListProps = {
  readonly projectId: string;
  readonly projectSlug: string;
};

// ============================================================================
// Main Component
// ============================================================================

export function ApiKeyList({ projectId, projectSlug }: ApiKeyListProps) {
  const { data: apiKeys, isLoading } = api.apiKey.list.useQuery({ projectId });
  const [rotatedKey, setRotatedKey] = useState<RotatedKeyData | null>(null);
  const [editingKey, setEditingKey] = useState<EditingKeyData | null>(null);
  const utils = api.useUtils();

  const { mutate: revokeKey, isPending: isRevoking } =
    api.apiKey.revoke.useMutation({
      onSuccess: () => utils.apiKey.list.invalidate(),
    });

  const { mutate: rotateKey, isPending: isRotating } =
    api.apiKey.rotate.useMutation({
      onSuccess: (result) => {
        utils.apiKey.list.invalidate();
        if (result?.publicKey && result?.secretKey && result?.name) {
          setRotatedKey({
            publicKey: result.publicKey,
            secretKey: result.secretKey,
            name: result.name,
          });
        }
      },
    });

  const { mutate: updateKey, isPending: isUpdating } =
    api.apiKey.update.useMutation({
      onSuccess: () => {
        utils.apiKey.list.invalidate();
        setEditingKey(null);
      },
    });

  const handleEditKey = (key: ApiKeyData): void => {
    setEditingKey({
      id: key.id,
      name: key.name,
      allowedSourceDomains: key.allowedSourceDomains,
      expiresAt: key.expiresAt,
    });
  };

  const handleSaveEdit = (domains: string[], expiresAt: Date | null): void => {
    if (editingKey) {
      updateKey({
        apiKeyId: editingKey.id,
        allowedSourceDomains: domains,
        expiresAt: expiresAt,
      });
    }
  };

  if (isLoading) {
    return <ApiKeyListSkeleton />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage authentication keys for this project. Secret keys are only
              shown once on creation or rotation.
            </CardDescription>
          </div>
          <CreateApiKeyDialog projectId={projectId} projectSlug={projectSlug} />
        </CardHeader>
        <CardContent>
          {!apiKeys?.length ? (
            <EmptyApiKeyState />
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <ApiKeyItem
                  key={key.id}
                  apiKey={key}
                  onRevoke={() => revokeKey({ apiKeyId: key.id })}
                  onRotate={() => rotateKey({ apiKeyId: key.id })}
                  onEdit={() => handleEditKey(key)}
                  isRevoking={isRevoking}
                  isRotating={isRotating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RotatedKeyDialog
        rotatedKey={rotatedKey}
        onClose={() => setRotatedKey(null)}
      />

      <EditApiKeyDialog
        editingKey={editingKey}
        onClose={() => setEditingKey(null)}
        onSave={handleSaveEdit}
        isUpdating={isUpdating}
      />
    </>
  );
}
