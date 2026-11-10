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
      accesos_desafios_virtuales: {
        Row: {
          actualizado_en: string
          defensa_en: string | null
          defensa_url: string | null
          desafio_id: string
          habilitado: boolean
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          defensa_en?: string | null
          defensa_url?: string | null
          desafio_id: string
          habilitado?: boolean
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          defensa_en?: string | null
          defensa_url?: string | null
          desafio_id?: string
          habilitado?: boolean
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accesos_desafios_virtuales_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "desafios_virtuales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accesos_desafios_virtuales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      archivos_desafios_virtuales: {
        Row: {
          creado_en: string
          desafio_id: string
          id: string
          mime: string
          nombre: string
          ruta: string
          tamano: number
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          desafio_id: string
          id?: string
          mime: string
          nombre: string
          ruta: string
          tamano: number
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          desafio_id?: string
          id?: string
          mime?: string
          nombre?: string
          ruta?: string
          tamano?: number
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archivos_desafios_virtuales_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "desafios_virtuales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archivos_desafios_virtuales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      desafios_virtuales: {
        Row: {
          actualizado_en: string
          consigna: string
          creado_en: string
          creado_por: string | null
          duracion_horas: number
          estado: string
          id: string
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          consigna: string
          creado_en?: string
          creado_por?: string | null
          duracion_horas?: number
          estado?: string
          id?: string
          titulo: string
        }
        Update: {
          actualizado_en?: string
          consigna?: string
          creado_en?: string
          creado_por?: string | null
          duracion_horas?: number
          estado?: string
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "desafios_virtuales_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
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
      devoluciones_borrador: {
        Row: {
          contenido: Json
          estudiante_id: string
          evento_id: string
          preparada_en: string
          revision_evaluaciones: number
        }
        Insert: {
          contenido: Json
          estudiante_id: string
          evento_id: string
          preparada_en?: string
          revision_evaluaciones: number
        }
        Update: {
          contenido?: Json
          estudiante_id?: string
          evento_id?: string
          preparada_en?: string
          revision_evaluaciones?: number
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_borrador_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_borrador_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones_jurado_general: {
        Row: {
          actualizada_en: string
          cargada_por: string
          equipo_id: string
          evento_id: string
          fuente: string
          texto: string
        }
        Insert: {
          actualizada_en?: string
          cargada_por: string
          equipo_id: string
          evento_id: string
          fuente: string
          texto: string
        }
        Update: {
          actualizada_en?: string
          cargada_por?: string
          equipo_id?: string
          evento_id?: string
          fuente?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_jurado_general_cargada_por_fkey"
            columns: ["cargada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_jurado_general_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: true
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_jurado_general_evento_id_fkey"
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
      entregas_equipo: {
        Row: {
          actualizado_en: string
          archivo_nombre: string
          archivo_path: string
          archivo_tamano: number
          archivo_tipo: string
          cargado_por: string | null
          equipo_id: string
        }
        Insert: {
          actualizado_en?: string
          archivo_nombre: string
          archivo_path: string
          archivo_tamano: number
          archivo_tipo: string
          cargado_por?: string | null
          equipo_id: string
        }
        Update: {
          actualizado_en?: string
          archivo_nombre?: string
          archivo_path?: string
          archivo_tamano?: number
          archivo_tipo?: string
          cargado_por?: string | null
          equipo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_equipo_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_equipo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: true
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          creado_en: string
          empresa_elegida: string | null
          entrega_en: string | null
          entrega_url: string | null
          evento_id: string
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string
          empresa_elegida?: string | null
          entrega_en?: string | null
          entrega_url?: string | null
          evento_id: string
          id?: string
          nombre: string
        }
        Update: {
          creado_en?: string
          empresa_elegida?: string | null
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
          revision_evaluaciones: number
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
          revision_evaluaciones?: number
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
          revision_evaluaciones?: number
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
      ganadores_evento: {
        Row: {
          equipo_id: string
          evento_id: string
          registrado_en: string
          registrado_por: string
        }
        Insert: {
          equipo_id: string
          evento_id: string
          registrado_en?: string
          registrado_por: string
        }
        Update: {
          equipo_id?: string
          evento_id?: string
          registrado_en?: string
          registrado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "ganadores_evento_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganadores_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ganadores_evento_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      informes_empresa: {
        Row: {
          archivo_ruta: string
          creado_en: string
          empresa_clave: string
          id: string
          titulo: string
        }
        Insert: {
          archivo_ruta: string
          creado_en?: string
          empresa_clave: string
          id?: string
          titulo: string
        }
        Update: {
          archivo_ruta?: string
          creado_en?: string
          empresa_clave?: string
          id?: string
          titulo?: string
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
      participaciones_virtuales: {
        Row: {
          actualizado_en: string
          borrador: Json
          desafio_id: string
          enviada_en: string | null
          iniciada_en: string
          investigacion_id: string | null
          usuario_id: string
          vence_en: string
        }
        Insert: {
          actualizado_en?: string
          borrador?: Json
          desafio_id: string
          enviada_en?: string | null
          iniciada_en?: string
          investigacion_id?: string | null
          usuario_id: string
          vence_en: string
        }
        Update: {
          actualizado_en?: string
          borrador?: Json
          desafio_id?: string
          enviada_en?: string | null
          iniciada_en?: string
          investigacion_id?: string | null
          usuario_id?: string
          vence_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "participaciones_virtuales_desafio_id_usuario_id_fkey"
            columns: ["desafio_id", "usuario_id"]
            isOneToOne: true
            referencedRelation: "accesos_desafios_virtuales"
            referencedColumns: ["desafio_id", "usuario_id"]
          },
          {
            foreignKeyName: "participaciones_virtuales_investigacion_id_fkey"
            columns: ["investigacion_id"]
            isOneToOne: false
            referencedRelation: "archivos_desafios_virtuales"
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
      presentaciones_equipo: {
        Row: {
          actualizado_en: string
          archivo_nombre: string
          archivo_path: string
          archivo_tamano: number
          archivo_tipo: string
          cargado_por: string | null
          equipo_id: string
        }
        Insert: {
          actualizado_en?: string
          archivo_nombre: string
          archivo_path: string
          archivo_tamano: number
          archivo_tipo: string
          cargado_por?: string | null
          equipo_id: string
        }
        Update: {
          actualizado_en?: string
          archivo_nombre?: string
          archivo_path?: string
          archivo_tamano?: number
          archivo_tipo?: string
          cargado_por?: string | null
          equipo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentaciones_equipo_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentaciones_equipo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: true
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      respaldos_desafios_virtuales: {
        Row: {
          creado_en: string
          creado_por: string | null
          datos: Json
          desafio_id: string
          id: string
          titulo: string
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          datos: Json
          desafio_id: string
          id?: string
          titulo: string
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          datos?: Json
          desafio_id?: string
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "respaldos_desafios_virtuales_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      respaldos_eliminacion: {
        Row: {
          creado_en: string
          cv_base64: string | null
          datos: Json
          id: string
          solicitado_por: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          cv_base64?: string | null
          datos: Json
          id?: string
          solicitado_por: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          cv_base64?: string | null
          datos?: Json
          id?: string
          solicitado_por?: string
          usuario_id?: string
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
      revisiones_virtuales: {
        Row: {
          actualizado_en: string
          borrador: Json
          desafio_id: string
          publicada: Json | null
          publicada_en: string | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          borrador?: Json
          desafio_id: string
          publicada?: Json | null
          publicada_en?: string | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          borrador?: Json
          desafio_id?: string
          publicada?: Json | null
          publicada_en?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisiones_virtuales_desafio_id_usuario_id_fkey"
            columns: ["desafio_id", "usuario_id"]
            isOneToOne: true
            referencedRelation: "participaciones_virtuales"
            referencedColumns: ["desafio_id", "usuario_id"]
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
      acceso_desafio_virtual: {
        Args: { p_desafio: string; p_habilitar: boolean; p_usuario: string }
        Returns: undefined
      }
      aplicar_invitaciones: {
        Args: { p_email: string; p_token?: string; p_usuario: string }
        Returns: undefined
      }
      comenzar_virtual: { Args: { p_desafio: string }; Returns: undefined }
      credencial_publica: { Args: { p_token: string }; Returns: Json }
      defensa_virtual: {
        Args: {
          p_desafio: string
          p_fecha: string
          p_url: string
          p_usuario: string
        }
        Returns: undefined
      }
      devoluciones_desactualizadas: {
        Args: { p_evento: string }
        Returns: boolean
      }
      devoluciones_publicadas: { Args: { p_evento: string }; Returns: boolean }
      elegir_empresa_equipo: {
        Args: { p_empresa: string; p_equipo: string }
        Returns: undefined
      }
      eliminar_desafio_virtual: {
        Args: { p_desafio: string; p_titulo: string }
        Returns: string
      }
      es_miembro: { Args: { p_equipo: string }; Returns: boolean }
      es_organizador: { Args: never; Returns: boolean }
      estado_desafio_virtual: {
        Args: { p_desafio: string; p_estado: string }
        Returns: undefined
      }
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
      evaluaciones_abiertas: { Args: { p_evento: string }; Returns: boolean }
      guardar_archivo_entrega: {
        Args: {
          p_equipo: string
          p_nombre: string
          p_ruta: string
          p_tamano: number
          p_tipo: string
        }
        Returns: undefined
      }
      guardar_desafio_virtual: {
        Args: {
          p_consigna: string
          p_horas: number
          p_id: string
          p_titulo: string
        }
        Returns: string
      }
      guardar_devolucion_jurado_general: {
        Args: { p_equipo: string; p_fuente: string; p_texto: string }
        Returns: undefined
      }
      guardar_empresa: {
        Args: { p_nombre: string; p_rubro: string; p_tamano: string }
        Returns: undefined
      }
      guardar_entrega_virtual: {
        Args: { p_datos: Json; p_desafio: string; p_enviar: boolean }
        Returns: undefined
      }
      guardar_preparacion_devoluciones: {
        Args: { p_evento: string; p_filas: Json; p_revision: number }
        Returns: number
      }
      guardar_presentacion_equipo: {
        Args: {
          p_equipo: string
          p_nombre: string
          p_ruta: string
          p_tamano: number
          p_tipo: string
        }
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
      mi_equipo_ganador: { Args: { p_evento: string }; Returns: boolean }
      mi_revision_virtual: { Args: { p_desafio: string }; Returns: Json }
      publicar_preparacion_devoluciones: {
        Args: { p_evento: string }
        Returns: number
      }
      puede_leer_archivo_entrega: { Args: { p_ruta: string }; Returns: boolean }
      puede_leer_archivo_virtual: { Args: { p_ruta: string }; Returns: boolean }
      puede_leer_desafios: { Args: never; Returns: boolean }
      puede_leer_informe_empresa: { Args: { p_ruta: string }; Returns: boolean }
      puede_limpiar_virtual: { Args: { p_ruta: string }; Returns: boolean }
      puede_subir_virtual: { Args: { p_ruta: string }; Returns: boolean }
      puede_ver_persona: { Args: { p_usuario: string }; Returns: boolean }
      puede_ver_virtual: { Args: { p_desafio: string }; Returns: boolean }
      reclamar_invitacion: { Args: { p_token: string }; Returns: string }
      registrar_archivo_virtual: {
        Args: {
          p_desafio: string
          p_mime: string
          p_nombre: string
          p_ruta: string
          p_tamano: number
          p_tipo: string
        }
        Returns: string
      }
      registrar_entrega: {
        Args: { p_equipo: string; p_url: string }
        Returns: undefined
      }
      registrar_equipo_ganador: {
        Args: { p_equipo: string; p_evento: string }
        Returns: undefined
      }
      respaldar_estudiante: {
        Args: { p_cv_base64?: string; p_email: string; p_usuario: string }
        Returns: string
      }
      resumen_landing: { Args: { p_desde?: string }; Returns: Json }
      revisar_entrega_virtual: {
        Args: {
          p_datos: Json
          p_desafio: string
          p_publicar: boolean
          p_usuario: string
        }
        Returns: undefined
      }
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
