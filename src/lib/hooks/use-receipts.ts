/**
 * Oniefy - Receipt Upload Hook (E39)
 *
 * Upload, view, and delete receipt/NF images attached to transactions.
 * Uses Supabase Storage (bucket: receipts, path: {user_id}/{tx_id}.{ext}).
 *
 * Supported formats: JPEG, PNG, WebP, PDF (5MB max).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserId } from "@/lib/supabase/cached-auth";

const BUCKET = "receipts";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a receipt image/PDF for a transaction.
 * Stores at path: {user_id}/{transaction_id}.{ext}
 * Updates transactions.receipt_path on success.
 */
export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      file,
    }: {
      transactionId: string;
      file: File;
    }) => {
      if (file.size > MAX_SIZE) {
        throw new Error("Arquivo excede o limite de 5MB.");
      }

      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
        throw new Error("Formato não suportado. Use JPEG, PNG, WebP ou PDF.");
      }

      const supabase = createClient();
      const userId = await getCachedUserId(supabase);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${transactionId}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

      // Update transaction with receipt path
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ receipt_path: path } as Record<string, unknown>)
        .eq("id", transactionId)
        .eq("user_id", userId);

      if (updateError) throw new Error(`Erro ao vincular: ${updateError.message}`);

      return { path };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Delete a receipt from storage and clear the reference.
 */
export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      receiptPath,
    }: {
      transactionId: string;
      receiptPath: string;
    }) => {
      const supabase = createClient();
      const userId = await getCachedUserId(supabase);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([receiptPath]);

      if (deleteError) throw new Error(`Erro ao deletar: ${deleteError.message}`);

      // Clear receipt_path on transaction
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ receipt_path: null } as Record<string, unknown>)
        .eq("id", transactionId)
        .eq("user_id", userId);

      if (updateError) throw new Error(`Erro ao desvincular: ${updateError.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Get a temporary signed URL for viewing a receipt.
 * URLs expire after 1 hour.
 */
export async function getReceiptUrl(receiptPath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(receiptPath, 3600); // 1 hour

  if (error) return null;
  return data.signedUrl;
}
