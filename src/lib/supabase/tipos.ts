export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asignaciones: {
        Row: {
          creado_en: string
          equipo_id: string
          evaluador_id: string
          evento_id: string
          id: string
          rol: string
        }
        Insert: {
          creado_en?: string
          equipo_id: string
          evaluador_id: string
          evento_id: string
          id?: string
          rol: string
        }
        Update: {
          creado_en?: string
          equipo_id?: string
          evaluador_id?: string
          evento_id?: string
          id?: string
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_equipo_id_evento_id_fkey"
            columns: ["equipo_id", "evento_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id", "evento_id"]
          },
          {
            foreignKeyName: "asignaciones_evaluador_id_fkey"
            columns: ["evaluador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          creado_en: string
          evento_id: string
          id: string
          metodo: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          evento_id: string
          id?: string
          metodo: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          evento_id?: string
          id?: string
          metodo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      codigos_asistencia: {
        Row: {
          codigo: string
          codigo_anterior: string | null
          evento_id: string
          rotado_en: string
        }
        Insert: {
          codigo: string
          codigo_anterior?: string | null
          evento_id: string
          rotado_en?: string
        }
        Update: {
          codigo?: string
          codigo_anterior?: string | null
          evento_id?: string
          rotado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "codigos_asistencia_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      credenciales: {
        Row: {
          creado_en: string
          id: string
          revocada_en: string | null
          token: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          revocada_en?: string | null
          token?: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          revocada_en?: string | null
          token?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credenciales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      desafios: {
        Row: {
          actualizado_en: string
          consigna: string
          creado_en: string
          estado: string
          evento_id: string | null
          fin: string | null
          id: string
          inicio: string | null
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          consigna: string
          creado_en?: string
          estado?: string
          evento_id?: string | null
          fin?: string | null
          id?: string
          inicio?: string | null
          titulo: string
        }
        Update: {
          actualizado_en?: string
          consigna?: string
          creado_en?: string
          estado?: string
          evento_id?: string | null
          fin?: string | null
          id?: string
          inicio?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "desafios_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones: {
        Row: {
          abierta_en: string | null
          contenido: Json
          creado_en: string
          estudiante_id: string
          evento_id: string
          id: string
          preparada_en: string
          publicada_en: string | null
        }
        Insert: {
          abierta_en?: string | null
          contenido: Json
          creado_en?: string
          estudiante_id: string
          evento_id: string
          id?: string
          preparada_en?: string
          publicada_en?: string | null
        }
        Update: {
          abierta_en?: string | null
          contenido?: Json
          creado_en?: string
          estudiante_id?: string
          evento_id?: string
          id?: string
          preparada_en?: string
          publicada_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      dimensiones: {
        Row: {
          id: string
          instancia: string
          nombre: string
          orden: number
          que_observar: string
          rubrica_id: string
        }
        Insert: {
          id?: string
          instancia: string
          nombre: string
          orden: number
          que_observar: string
          rubrica_id: string
        }
        Update: {
          id?: string
          instancia?: string
          nombre?: string
          orden?: number
          que_observar?: string
          rubrica_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimensiones_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          actualizado_en: string
          creado_en: string
          nombre: string
          rubro: string
          tamano: string
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          nombre: string
          rubro: string
          tamano: string
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          nombre?: string
          rubro?: string
          tamano?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          creado_en: string
          entrega_en: string | null
          entrega_url: string | null
          evento_id: string
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string
          entrega_en?: string | null
          entrega_url?: string | null
          evento_id: string
          id?: string
          nombre: string
        }
        Update: {
          creado_en?: string
          entrega_en?: string | null
          entrega_url?: string | null
          evento_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      estudiantes: {
        Row: {
          actualizado_en: string
          anio_carrera: string | null
          area_buscada: string | null
          arquetipo: string | null
          arquetipo_respuestas: Json | null
          carrera: string | null
          consentimiento_en: string
          creado_en: string
          cv_path: string | null
          intereses: string[]
          onboarding_completo_en: string | null
          por_que: string | null
          universidad: string | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          anio_carrera?: string | null
          area_buscada?: string | null
          arquetipo?: string | null
          arquetipo_respuestas?: Json | null
          carrera?: string | null
          consentimiento_en: string
          creado_en?: string
          cv_path?: string | null
          intereses?: string[]
          onboarding_completo_en?: string | null
          por_que?: string | null
          universidad?: string | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          anio_carrera?: string | null
          area_buscada?: string | null
          arquetipo?: string | null
          arquetipo_respuestas?: Json | null
          carrera?: string | null
          consentimiento_en?: string
          creado_en?: string
          cv_path?: string | null
          intereses?: string[]
          onboarding_completo_en?: string | null
          por_que?: string | null
          universidad?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudiantes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          actualizado_en: string
          carga: string
          cargada_por: string | null
          comentario: string | null
          creado_en: string
          enviada_en: string | null
          equipo_id: string
          estado: string
          estudiante_id: string | null
          evaluador_id: string
          evento_id: string
          id: string
          objetivo: string
          respuestas: Json
          rol_evaluador: string
          rubrica_id: string
        }
        Insert: {
          actualizado_en?: string
          carga?: string
          cargada_por?: string | null
          comentario?: string | null
          creado_en?: string
          enviada_en?: string | null
          equipo_id: string
          estado?: string
          estudiante_id?: string | null
          evaluador_id: string
          evento_id: string
          id?: string
          objetivo: string
          respuestas?: Json
          rol_evaluador: string
          rubrica_id: string
        }
        Update: {
          actualizado_en?: string
          carga?: string
          cargada_por?: string | null
          comentario?: string | null
          creado_en?: string
          enviada_en?: string | null
          equipo_id?: string
          estado?: string
          estudiante_id?: string | null
          evaluador_id?: string
          evento_id?: string
          id?: string
          objetivo?: string
          respuestas?: Json
          rol_evaluador?: string
          rubrica_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_cargada_por_fkey"
            columns: ["cargada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_evaluador_id_fkey"
            columns: ["evaluador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_evento_del_equipo"
            columns: ["equipo_id", "evento_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id", "evento_id"]
          },
          {
            foreignKeyName: "evaluaciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          actualizado_en: string
          creado_en: string
          devoluciones_publicadas_en: string | null
          estado: string
          fecha: string
          id: string
          lugar: string | null
          nombre: string
          rubrica_id: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          devoluciones_publicadas_en?: string | null
          estado?: string
          fecha: string
          id?: string
          lugar?: string | null
          nombre: string
          rubrica_id?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          devoluciones_publicadas_en?: string | null
          estado?: string
          fecha?: string
          id?: string
          lugar?: string | null
          nombre?: string
          rubrica_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_landing: {
        Row: {
          creado_en: string
          detalle: string | null
          id: number
          ip_hash: string | null
          origen: Json
          tipo: string
          variante: string | null
          visitante_id: string
        }
        Insert: {
          creado_en?: string
          detalle?: string | null
          id?: never
          ip_hash?: string | null
          origen?: Json
          tipo: string
          variante?: string | null
          visitante_id: string
        }
        Update: {
          creado_en?: string
          detalle?: string | null
          id?: never
          ip_hash?: string | null
          origen?: Json
          tipo?: string
          variante?: string | null
          visitante_id?: string
        }
        Relationships: []
      }
      interesados: {
        Row: {
          audiencia: string
          creado_en: string
          datos: Json
          email: string
          id: string
          ip_hash: string | null
          origen: Json
          variante: string | null
          visitante_id: string | null
        }
        Insert: {
          audiencia: string
          creado_en?: string
          datos?: Json
          email: string
          id?: string
          ip_hash?: string | null
          origen?: Json
          variante?: string | null
          visitante_id?: string | null
        }
        Update: {
          audiencia?: string
          creado_en?: string
          datos?: Json
          email?: string
          id?: string
          ip_hash?: string | null
          origen?: Json
          variante?: string | null
          visitante_id?: string | null
        }
        Relationships: []
      }
      invitaciones: {
        Row: {
          creada_por: string | null
          creado_en: string
          email: string
          equipo_id: string | null
          evento_id: string | null
          id: string
          nombre: string | null
          rol: string
          token: string
          usada_en: string | null
        }
        Insert: {
          creada_por?: string | null
          creado_en?: string
          email: string
          equipo_id?: string | null
          evento_id?: string | null
          id?: string
          nombre?: string | null
          rol: string
          token?: string
          usada_en?: string | null
        }
        Update: {
          creada_por?: string | null
          creado_en?: string
          email?: string
          equipo_id?: string | null
          evento_id?: string | null
          id?: string
          nombre?: string | null
          rol?: string
          token?: string
          usada_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_evento"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros_equipo: {
        Row: {
          creado_en: string
          equipo_id: string
          evento_id: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          equipo_id: string
          evento_id: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          equipo_id?: string
          evento_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miembros_equipo_equipo_id_evento_id_fkey"
            columns: ["equipo_id", "evento_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id", "evento_id"]
          },
          {
            foreignKeyName: "miembros_equipo_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      niveles: {
        Row: {
          descripcion: string
          id: string
          nombre: string
          orden: number
          rubrica_id: string
        }
        Insert: {
          descripcion: string
          id?: string
          nombre: string
          orden: number
          rubrica_id: string
        }
        Update: {
          descripcion?: string
          id?: string
          nombre?: string
          orden?: number
          rubrica_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveles_rubrica_id_fkey"
            columns: ["rubrica_id"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas: {
        Row: {
          actividad: string
          eventos: Json
          id: string
          iniciada_en: string
          numero: number
          objetivo: Json | null
          resultado: string
          terminada_en: string | null
          tipo: string
          usuario_id: string
          version: number
        }
        Insert: {
          actividad: string
          eventos?: Json
          id?: string
          iniciada_en?: string
          numero?: number
          objetivo?: Json | null
          resultado?: string
          terminada_en?: string | null
          tipo: string
          usuario_id: string
          version: number
        }
        Update: {
          actividad?: string
          eventos?: Json
          id?: string
          iniciada_en?: string
          numero?: number
          objetivo?: Json | null
          resultado?: string
          terminada_en?: string | null
          tipo?: string
          usuario_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "partidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          actualizado_en: string
          apellido: string | null
          creado_en: string
          email: string
          id: string
          nombre: string | null
        }
        Insert: {
          actualizado_en?: string
          apellido?: string | null
          creado_en?: string
          email: string
          id: string
          nombre?: string | null
        }
        Update: {
          actualizado_en?: string
          apellido?: string | null
          creado_en?: string
          email?: string
          id?: string
          nombre?: string | null
        }
        Relationships: []
      }
      respuestas_encuesta: {
        Row: {
          creado_en: string
          encuesta: string
          evento_id: string | null
          id: string
          partida_id: string | null
          respuestas: Json
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          encuesta: string
          evento_id?: string | null
          id?: string
          partida_id?: string | null
          respuestas: Json
          usuario_id?: string
        }
        Update: {
          creado_en?: string
          encuesta?: string
          evento_id?: string | null
          id?: string
          partida_id?: string | null
          respuestas?: Json
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_encuesta_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_encuesta_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_encuesta_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_usuario: {
        Row: {
          creado_en: string
          evento_id: string | null
          id: string
          rol: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          evento_id?: string | null
          id?: string
          rol: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          evento_id?: string | null
          id?: string
          rol?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_usuario_evento"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rubricas: {
        Row: {
          creado_en: string
          descripcion: string | null
          es_plantilla: boolean
          evento_id: string | null
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string
          descripcion?: string | null
          es_plantilla?: boolean
          evento_id?: string | null
          id?: string
          nombre: string
        }
        Update: {
          creado_en?: string
          descripcion?: string | null
          es_plantilla?: boolean
          evento_id?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubricas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      senales: {
        Row: {
          clave: string
          creado_en: string
          detalle: Json
          id: string
          partida_id: string
          regla: string
          usuario_id: string
          valor: number
        }
        Insert: {
          clave: string
          creado_en?: string
          detalle?: Json
          id?: string
          partida_id: string
          regla: string
          usuario_id: string
          valor: number
        }
        Update: {
          clave?: string
          creado_en?: string
          detalle?: Json
          id?: string
          partida_id?: string
          regla?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "senales_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_invitaciones: {
        Args: { p_email: string; p_token?: string; p_usuario: string }
        Returns: undefined
      }
      credencial_publica: { Args: { p_token: string }; Returns: Json }
      devoluciones_desactualizadas: {
        Args: { p_evento: string }
        Returns: boolean
      }
      devoluciones_publicadas: { Args: { p_evento: string }; Returns: boolean }
      es_miembro: { Args: { p_equipo: string }; Returns: boolean }
      es_organizador: { Args: never; Returns: boolean }
      evalua_equipo: {
        Args: { p_equipo: string; p_rol?: string }
        Returns: boolean
      }
      evaluacion_permitida: {
        Args: {
          p_equipo: string
          p_estudiante: string
          p_evaluador: string
          p_rol: string
        }
        Returns: boolean
      }
      guardar_empresa: {
        Args: { p_nombre: string; p_rubro: string; p_tamano: string }
        Returns: undefined
      }
      iniciar_registro_empresa: { Args: never; Returns: undefined }
      mail_de_invitacion: { Args: { p_token: string }; Returns: string }
      mail_verificado: { Args: { p_usuario: string }; Returns: boolean }
      marcar_asistencia: { Args: { p_codigo: string }; Returns: string }
      marcar_devolucion_abierta: {
        Args: { p_devolucion: string }
        Returns: undefined
      }
      marcar_preparadas: { Args: { p_evento: string }; Returns: undefined }
      puede_ver_persona: { Args: { p_usuario: string }; Returns: boolean }
      reclamar_invitacion: { Args: { p_token: string }; Returns: string }
      registrar_entrega: {
        Args: { p_equipo: string; p_url: string }
        Returns: undefined
      }
      resumen_landing: { Args: { p_desde?: string }; Returns: Json }
      tiene_rol: { Args: { p_rol: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
