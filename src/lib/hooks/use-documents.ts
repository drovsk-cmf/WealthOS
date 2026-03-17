"use client";

/**
 * Document upload hook (WKF-03 + PAT-06)
 *
 * Uploads file to Supabase Storage (bucket: user-documents)
 * and creates a record in the documents table with polymorphic link.
 *
 * Storage path: {user_id}/{related_table}/{related_id}/{filename}
 * Supported formats: JPG, PNG, PDF, XLSX, CSV, OFX
 * Max size: 10 MB
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "user-documents";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/x-ofx",
  "text/ofx",
];

export interface UploadDocumentInput {
  file: File;
  relatedTable: string; // e.g. "workflow_tasks", "assets"
  relatedId: string;    // UUID of the related record
}

export interface Document {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  related_table: string;
  related_id: string;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
}

/** Upload a file and create document record */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadDocumentInput): Promise<Document> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Validate
      if (input.file.size > MAX_SIZE_BYTES) {
        throw new Error(`Arquivo muito grande (máx. ${MAX_SIZE_BYTES / 1024 / 1024} MB).`);
      }
      if (!ALLOWED_TYPES.includes(input.file.type) && !input.file.name.endsWith(".ofx")) {
        throw new Error("Formato não suportado. Use JPG, PNG, PDF, XLSX, CSV ou OFX.");
      }

      // Build storage path: {user_id}/{table}/{related_id}/{timestamp}_{filename}
      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${input.relatedTable}/${input.relatedId}/${Date.now()}_${safeName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, input.file, {
          contentType: input.file.type,
          upsert: false,
        });

      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_path: storagePath,
          file_name: input.file.name,
          mime_type: input.file.type,
          size_bytes: input.file.size,
          related_table: input.relatedTable,
          related_id: input.relatedId,
        })
        .select()
        .single();

      if (error) {
        // Rollback: delete uploaded file
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw new Error(`Falha ao registrar documento: ${error.message}`);
      }

      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["workflow_tasks"] });
    },
  });
}

/** List documents for a related entity */
export function useDocuments(relatedTable: string, relatedId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["documents", relatedTable, relatedId],
    enabled: !!relatedId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Document[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("related_table", relatedTable)
        .eq("related_id", relatedId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
  });
}

/** Get signed URL for a document (valid 1h) */
export function useDocumentUrl(filePath: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["document_url", filePath],
    enabled: !!filePath,
    staleTime: 50 * 60 * 1000, // 50 min (URL valid 1h)
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath!, 3600);

      if (error) throw error;
      return data.signedUrl;
    },
  });
}

/** Delete a document (storage + record) */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Delete from storage
      await supabase.storage.from(BUCKET).remove([doc.file_path]);

      // Delete record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
