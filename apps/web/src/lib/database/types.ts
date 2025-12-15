export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          website_url: string | null
          primary_color: string
          secondary_color: string
          contact_email: string | null
          contact_phone: string | null
          address: Json
          settings: Json
          subscription_plan: 'basic' | 'premium' | 'enterprise'
          max_users: number
          max_storage_gb: number
          max_courses: number
          max_exams_per_month: number
          features: Json
          billing_info: Json
          is_active: boolean
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          website_url?: string | null
          primary_color?: string
          secondary_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json
          settings?: Json
          subscription_plan?: 'basic' | 'premium' | 'enterprise'
          max_users?: number
          max_storage_gb?: number
          max_courses?: number
          max_exams_per_month?: number
          features?: Json
          billing_info?: Json
          is_active?: boolean
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          website_url?: string | null
          primary_color?: string
          secondary_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json
          settings?: Json
          subscription_plan?: 'basic' | 'premium' | 'enterprise'
          max_users?: number
          max_storage_gb?: number
          max_courses?: number
          max_exams_per_month?: number
          features?: Json
          billing_info?: Json
          is_active?: boolean
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'student' | 'teacher' | 'admin' | 'super_admin'
          full_name: string
          first_name: string | null
          last_name: string | null
          profile_image_url: string | null
          phone_number: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          timezone: string
          language: string
          is_active: boolean
          is_verified: boolean
          last_login: string | null
          last_activity: string | null
          password_changed_at: string
          mfa_enabled: boolean
          mfa_secret: string | null
          backup_codes: Json
          permissions: Json
          preferences: Json
          notification_settings: Json
          student_id: string | null
          enrollment_year: number | null
          graduation_year: number | null
          department: string | null
          year_of_study: number | null
          employee_id: string | null
          specialization: string[] | null
          qualifications: Json
          experience_years: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          role?: 'student' | 'teacher' | 'admin' | 'super_admin'
          full_name: string
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          timezone?: string
          language?: string
          is_active?: boolean
          is_verified?: boolean
          last_login?: string | null
          last_activity?: string | null
          password_changed_at?: string
          mfa_enabled?: boolean
          mfa_secret?: string | null
          backup_codes?: Json
          permissions?: Json
          preferences?: Json
          notification_settings?: Json
          student_id?: string | null
          enrollment_year?: number | null
          graduation_year?: number | null
          department?: string | null
          year_of_study?: number | null
          employee_id?: string | null
          specialization?: string[] | null
          qualifications?: Json
          experience_years?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: 'student' | 'teacher' | 'admin' | 'super_admin'
          full_name?: string
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          timezone?: string
          language?: string
          is_active?: boolean
          is_verified?: boolean
          last_login?: string | null
          last_activity?: string | null
          password_changed_at?: string
          mfa_enabled?: boolean
          mfa_secret?: string | null
          backup_codes?: Json
          permissions?: Json
          preferences?: Json
          notification_settings?: Json
          student_id?: string | null
          enrollment_year?: number | null
          graduation_year?: number | null
          department?: string | null
          year_of_study?: number | null
          employee_id?: string | null
          specialization?: string[] | null
          qualifications?: Json
          experience_years?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          organization_id: string
          category_id: string | null
          title: string
          description: string | null
          cover_image_url: string | null
          banner_image_url: string | null
          teacher_id: string
          co_teachers: string[]
          course_code: string | null
          credit_hours: number
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours: number
          prerequisites: string[]
          learning_objectives: string[]
          is_published: boolean
          is_featured: boolean
          allow_enrollment: boolean
          enrollment_limit: number | null
          enrollment_start_date: string | null
          enrollment_end_date: string | null
          course_start_date: string | null
          course_end_date: string | null
          is_free: boolean
          price: number
          currency: string
          settings: Json
          metadata: Json
          enrollment_count: number
          completion_count: number
          rating_average: number
          rating_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          category_id?: string | null
          title: string
          description?: string | null
          cover_image_url?: string | null
          banner_image_url?: string | null
          teacher_id: string
          co_teachers?: string[]
          course_code?: string | null
          credit_hours?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours?: number
          prerequisites?: string[]
          learning_objectives?: string[]
          is_published?: boolean
          is_featured?: boolean
          allow_enrollment?: boolean
          enrollment_limit?: number | null
          enrollment_start_date?: string | null
          enrollment_end_date?: string | null
          course_start_date?: string | null
          course_end_date?: string | null
          is_free?: boolean
          price?: number
          currency?: string
          settings?: Json
          metadata?: Json
          enrollment_count?: number
          completion_count?: number
          rating_average?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          category_id?: string | null
          title?: string
          description?: string | null
          cover_image_url?: string | null
          banner_image_url?: string | null
          teacher_id?: string
          co_teachers?: string[]
          course_code?: string | null
          credit_hours?: number
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours?: number
          prerequisites?: string[]
          learning_objectives?: string[]
          is_published?: boolean
          is_featured?: boolean
          allow_enrollment?: boolean
          enrollment_limit?: number | null
          enrollment_start_date?: string | null
          enrollment_end_date?: string | null
          course_start_date?: string | null
          course_end_date?: string | null
          is_free?: boolean
          price?: number
          currency?: string
          settings?: Json
          metadata?: Json
          enrollment_count?: number
          completion_count?: number
          rating_average?: number
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          course_id: string
          parent_section_id: string | null
          title: string
          description: string | null
          content: string | null
          rich_content: Json | null
          section_type: 'content' | 'quiz' | 'assignment' | 'video' | 'reading'
          order_index: number
          is_published: boolean
          is_required: boolean
          estimated_duration_minutes: number
          unlock_date: string | null
          due_date: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          parent_section_id?: string | null
          title: string
          description?: string | null
          content?: string | null
          rich_content?: Json | null
          section_type?: 'content' | 'quiz' | 'assignment' | 'video' | 'reading'
          order_index?: number
          is_published?: boolean
          is_required?: boolean
          estimated_duration_minutes?: number
          unlock_date?: string | null
          due_date?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          parent_section_id?: string | null
          title?: string
          description?: string | null
          content?: string | null
          rich_content?: Json | null
          section_type?: 'content' | 'quiz' | 'assignment' | 'video' | 'reading'
          order_index?: number
          is_published?: boolean
          is_required?: boolean
          estimated_duration_minutes?: number
          unlock_date?: string | null
          due_date?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      course_enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          enrollment_date: string
          enrollment_status: 'pending' | 'active' | 'completed' | 'dropped' | 'suspended'
          completion_date: string | null
          progress_percentage: number
          last_accessed: string | null
          total_time_spent_minutes: number
          final_grade: number | null
          grade_letter: string | null
          is_passed: boolean
          is_active: boolean
          receive_notifications: boolean
          enrollment_source: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          enrollment_date?: string
          enrollment_status?: 'pending' | 'active' | 'completed' | 'dropped' | 'suspended'
          completion_date?: string | null
          progress_percentage?: number
          last_accessed?: string | null
          total_time_spent_minutes?: number
          final_grade?: number | null
          grade_letter?: string | null
          is_passed?: boolean
          is_active?: boolean
          receive_notifications?: boolean
          enrollment_source?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          enrollment_date?: string
          enrollment_status?: 'pending' | 'active' | 'completed' | 'dropped' | 'suspended'
          completion_date?: string | null
          progress_percentage?: number
          last_accessed?: string | null
          total_time_spent_minutes?: number
          final_grade?: number | null
          grade_letter?: string | null
          is_passed?: boolean
          is_active?: boolean
          receive_notifications?: boolean
          enrollment_source?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          organization_id: string
          section_id: string | null
          question_bank_id: string | null
          type: 'mcq' | 'coding' | 'essay' | 'file_upload' | 'true_false' | 'fill_blank' | 'matching'
          title: string
          description: string | null
          content_type: 'plain' | 'rich' | 'markdown'
          rich_content: Json | null
          points: number
          difficulty: 'easy' | 'medium' | 'hard'
          tags: Json
          order_index: number
          is_published: boolean
          usage_count: number
          success_rate: number
          average_time_seconds: number
          created_by: string
          last_modified_by: string | null
          version: number
          parent_question_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          section_id?: string | null
          question_bank_id?: string | null
          type: 'mcq' | 'coding' | 'essay' | 'file_upload' | 'true_false' | 'fill_blank' | 'matching'
          title: string
          description?: string | null
          content_type?: 'plain' | 'rich' | 'markdown'
          rich_content?: Json | null
          points?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          tags?: Json
          order_index?: number
          is_published?: boolean
          usage_count?: number
          success_rate?: number
          average_time_seconds?: number
          created_by: string
          last_modified_by?: string | null
          version?: number
          parent_question_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          section_id?: string | null
          question_bank_id?: string | null
          type?: 'mcq' | 'coding' | 'essay' | 'file_upload' | 'true_false' | 'fill_blank' | 'matching'
          title?: string
          description?: string | null
          content_type?: 'plain' | 'rich' | 'markdown'
          rich_content?: Json | null
          points?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          tags?: Json
          order_index?: number
          is_published?: boolean
          usage_count?: number
          success_rate?: number
          average_time_seconds?: number
          created_by?: string
          last_modified_by?: string | null
          version?: number
          parent_question_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mcq_questions: {
        Row: {
          id: string
          question_id: string
          question_text: string
          rich_question_text: Json | null
          options: Json
          correct_answers: Json
          is_multiple_choice: boolean
          randomize_options: boolean
          show_answer_immediately: boolean
          explanation: string | null
          rich_explanation: Json | null
          hints: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          question_text: string
          rich_question_text?: Json | null
          options: Json
          correct_answers: Json
          is_multiple_choice?: boolean
          randomize_options?: boolean
          show_answer_immediately?: boolean
          explanation?: string | null
          rich_explanation?: Json | null
          hints?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          question_text?: string
          rich_question_text?: Json | null
          options?: Json
          correct_answers?: Json
          is_multiple_choice?: boolean
          randomize_options?: boolean
          show_answer_immediately?: boolean
          explanation?: string | null
          rich_explanation?: Json | null
          hints?: Json
          created_at?: string
          updated_at?: string
        }
      }
      coding_questions: {
        Row: {
          id: string
          question_id: string
          problem_statement: string
          rich_problem_statement: Json | null
          boilerplate_code: Json
          solution_code: Json | null
          test_cases: Json
          allowed_languages: Json
          time_limit: number
          memory_limit: number
          is_solution_provided: boolean
          show_expected_output: boolean
          allow_custom_input: boolean
          evaluation_type: 'exact' | 'fuzzy' | 'custom'
          custom_checker_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          problem_statement: string
          rich_problem_statement?: Json | null
          boilerplate_code: Json
          solution_code?: Json | null
          test_cases: Json
          allowed_languages: Json
          time_limit?: number
          memory_limit?: number
          is_solution_provided?: boolean
          show_expected_output?: boolean
          allow_custom_input?: boolean
          evaluation_type?: 'exact' | 'fuzzy' | 'custom'
          custom_checker_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          problem_statement?: string
          rich_problem_statement?: Json | null
          boilerplate_code?: Json
          solution_code?: Json | null
          test_cases?: Json
          allowed_languages?: Json
          time_limit?: number
          memory_limit?: number
          is_solution_provided?: boolean
          show_expected_output?: boolean
          allow_custom_input?: boolean
          evaluation_type?: 'exact' | 'fuzzy' | 'custom'
          custom_checker_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          organization_id: string
          course_id: string | null
          title: string
          slug: string
          description: string | null
          instructions: string | null
          teacher_id: string
          co_teachers: string[]
          start_time: string
          end_time: string
          duration_minutes: number
          grace_period_minutes: number
          total_marks: number
          pass_marks: number | null
          pass_percentage: number | null
          randomize_questions: boolean
          randomize_options: boolean
          questions_per_page: number
          allowed_languages: Json
          allowed_users: string[]
          blocked_users: string[]
          ip_restrictions: string[]
          allowed_ip: string | null
          security_settings: Json
          proctoring_enabled: boolean
          require_webcam: boolean
          require_microphone: boolean
          lock_screen: boolean
          disable_copy_paste: boolean
          prevent_tab_switching: boolean
          show_results_immediately: boolean
          show_correct_answers: boolean
          allow_review: boolean
          show_score_breakdown: boolean
          max_attempts: number
          attempt_timeout_minutes: number | null
          is_published: boolean
          is_practice: boolean
          submission_count: number
          average_score: number
          completion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          course_id?: string | null
          title: string
          slug: string
          description?: string | null
          instructions?: string | null
          teacher_id: string
          co_teachers?: string[]
          start_time: string
          end_time: string
          duration_minutes: number
          grace_period_minutes?: number
          total_marks?: number
          pass_marks?: number | null
          pass_percentage?: number | null
          randomize_questions?: boolean
          randomize_options?: boolean
          questions_per_page?: number
          allowed_languages?: Json
          allowed_users?: string[]
          blocked_users?: string[]
          ip_restrictions?: string[]
          allowed_ip?: string | null
          security_settings?: Json
          proctoring_enabled?: boolean
          require_webcam?: boolean
          require_microphone?: boolean
          lock_screen?: boolean
          disable_copy_paste?: boolean
          prevent_tab_switching?: boolean
          show_results_immediately?: boolean
          show_correct_answers?: boolean
          allow_review?: boolean
          show_score_breakdown?: boolean
          max_attempts?: number
          attempt_timeout_minutes?: number | null
          is_published?: boolean
          is_practice?: boolean
          submission_count?: number
          average_score?: number
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          course_id?: string | null
          title?: string
          slug?: string
          description?: string | null
          instructions?: string | null
          teacher_id?: string
          co_teachers?: string[]
          start_time?: string
          end_time?: string
          duration_minutes?: number
          grace_period_minutes?: number
          total_marks?: number
          pass_marks?: number | null
          pass_percentage?: number | null
          randomize_questions?: boolean
          randomize_options?: boolean
          questions_per_page?: number
          allowed_languages?: Json
          allowed_users?: string[]
          blocked_users?: string[]
          ip_restrictions?: string[]
          allowed_ip?: string | null
          security_settings?: Json
          proctoring_enabled?: boolean
          require_webcam?: boolean
          require_microphone?: boolean
          lock_screen?: boolean
          disable_copy_paste?: boolean
          prevent_tab_switching?: boolean
          show_results_immediately?: boolean
          show_correct_answers?: boolean
          allow_review?: boolean
          show_score_breakdown?: boolean
          max_attempts?: number
          attempt_timeout_minutes?: number | null
          is_published?: boolean
          is_practice?: boolean
          submission_count?: number
          average_score?: number
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      exam_submissions: {
        Row: {
          id: string
          exam_id: string
          student_id: string | null
          attempt_number: number
          roll_number: string | null
          student_name: string
          student_email: string
          student_section: string | null
          started_at: string
          submitted_at: string | null
          time_taken_minutes: number | null
          auto_submitted: boolean
          total_score: number
          max_score: number
          percentage: number | null
          grade_letter: string | null
          is_passed: boolean
          submission_status: 'in_progress' | 'submitted' | 'graded' | 'cancelled'
          is_submitted: boolean
          requires_manual_grading: boolean
          answers: Json
          question_order: Json
          security_log: Json
          browser_info: Json
          feedback: string | null
          teacher_comments: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id?: string | null
          attempt_number?: number
          roll_number?: string | null
          student_name: string
          student_email: string
          student_section?: string | null
          started_at?: string
          submitted_at?: string | null
          time_taken_minutes?: number | null
          auto_submitted?: boolean
          total_score?: number
          max_score?: number
          percentage?: number | null
          grade_letter?: string | null
          is_passed?: boolean
          submission_status?: 'in_progress' | 'submitted' | 'graded' | 'cancelled'
          is_submitted?: boolean
          requires_manual_grading?: boolean
          answers?: Json
          question_order?: Json
          security_log?: Json
          browser_info?: Json
          feedback?: string | null
          teacher_comments?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string | null
          attempt_number?: number
          roll_number?: string | null
          student_name?: string
          student_email?: string
          student_section?: string | null
          started_at?: string
          submitted_at?: string | null
          time_taken_minutes?: number | null
          auto_submitted?: boolean
          total_score?: number
          max_score?: number
          percentage?: number | null
          grade_letter?: string | null
          is_passed?: boolean
          submission_status?: 'in_progress' | 'submitted' | 'graded' | 'cancelled'
          is_submitted?: boolean
          requires_manual_grading?: boolean
          answers?: Json
          question_order?: Json
          security_log?: Json
          browser_info?: Json
          feedback?: string | null
          teacher_comments?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      attempts: {
        Row: {
          id: string
          user_id: string | null
          question_id: string
          exam_submission_id: string | null
          section_id: string | null
          attempt_number: number
          attempt_type: 'mcq' | 'coding' | 'essay' | 'file_upload'
          answer: Json | null
          submitted_files: string[]
          language: string | null
          code_execution_result: Json | null
          test_cases_passed: number
          total_test_cases: number
          execution_time: number | null
          memory_used: number | null
          is_correct: boolean
          points_earned: number
          max_points: number
          auto_graded: boolean
          time_taken: number | null
          started_at: string
          submitted_at: string | null
          feedback: string | null
          ai_feedback: Json | null
          teacher_feedback: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          question_id: string
          exam_submission_id?: string | null
          section_id?: string | null
          attempt_number?: number
          attempt_type: 'mcq' | 'coding' | 'essay' | 'file_upload'
          answer?: Json | null
          submitted_files?: string[]
          language?: string | null
          code_execution_result?: Json | null
          test_cases_passed?: number
          total_test_cases?: number
          execution_time?: number | null
          memory_used?: number | null
          is_correct?: boolean
          points_earned?: number
          max_points?: number
          auto_graded?: boolean
          time_taken?: number | null
          started_at?: string
          submitted_at?: string | null
          feedback?: string | null
          ai_feedback?: Json | null
          teacher_feedback?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          question_id?: string
          exam_submission_id?: string | null
          section_id?: string | null
          attempt_number?: number
          attempt_type?: 'mcq' | 'coding' | 'essay' | 'file_upload'
          answer?: Json | null
          submitted_files?: string[]
          language?: string | null
          code_execution_result?: Json | null
          test_cases_passed?: number
          total_test_cases?: number
          execution_time?: number | null
          memory_used?: number | null
          is_correct?: boolean
          points_earned?: number
          max_points?: number
          auto_graded?: boolean
          time_taken?: number | null
          started_at?: string
          submitted_at?: string | null
          feedback?: string | null
          ai_feedback?: Json | null
          teacher_feedback?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      section_progress: {
        Row: {
          id: string
          user_id: string
          section_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          questions_completed: number
          total_questions: number
          completion_percentage: number
          time_spent_minutes: number
          started_at: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          questions_completed?: number
          total_questions?: number
          completion_percentage?: number
          time_spent_minutes?: number
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          questions_completed?: number
          total_questions?: number
          completion_percentage?: number
          time_spent_minutes?: number
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          title: string
          message: string
          rich_content: Json | null
          type: 'info' | 'success' | 'warning' | 'error' | 'exam' | 'course' | 'system' | 'assignment'
          category: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          is_read: boolean
          is_archived: boolean
          action_url: string | null
          action_label: string | null
          data: Json | null
          send_at: string
          expires_at: string | null
          delivery_method: string[]
          email_sent: boolean
          sms_sent: boolean
          push_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          title: string
          message: string
          rich_content?: Json | null
          type: 'info' | 'success' | 'warning' | 'error' | 'exam' | 'course' | 'system' | 'assignment'
          category?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          is_read?: boolean
          is_archived?: boolean
          action_url?: string | null
          action_label?: string | null
          data?: Json | null
          send_at?: string
          expires_at?: string | null
          delivery_method?: string[]
          email_sent?: boolean
          sms_sent?: boolean
          push_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          title?: string
          message?: string
          rich_content?: Json | null
          type?: 'info' | 'success' | 'warning' | 'error' | 'exam' | 'course' | 'system' | 'assignment'
          category?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          is_read?: boolean
          is_archived?: boolean
          action_url?: string | null
          action_label?: string | null
          data?: Json | null
          send_at?: string
          expires_at?: string | null
          delivery_method?: string[]
          email_sent?: boolean
          sms_sent?: boolean
          push_sent?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Additional type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific entity types for easier use
export type Organization = Tables<'organizations'>
export type User = Tables<'users'>
export type Course = Tables<'courses'>
export type Section = Tables<'sections'>
export type SectionProgress = Tables<'section_progress'>
export type CourseEnrollment = Tables<'course_enrollments'>
export type Question = Tables<'questions'>
export type MCQQuestion = Tables<'mcq_questions'>
export type CodingQuestion = Tables<'coding_questions'>
export type Exam = Tables<'exams'>
export type ExamSubmission = Tables<'exam_submissions'>
export type Attempt = Tables<'attempts'>
export type Notification = Tables<'notifications'>

// Insert types
export type OrganizationInsert = TablesInsert<'organizations'>
export type UserInsert = TablesInsert<'users'>
export type CourseInsert = TablesInsert<'courses'>
export type SectionInsert = TablesInsert<'sections'>
export type SectionProgressInsert = TablesInsert<'section_progress'>
export type QuestionInsert = TablesInsert<'questions'>
export type ExamInsert = TablesInsert<'exams'>

// Update types
export type OrganizationUpdate = TablesUpdate<'organizations'>
export type UserUpdate = TablesUpdate<'users'>
export type CourseUpdate = TablesUpdate<'courses'>
export type SectionUpdate = TablesUpdate<'sections'>
export type SectionProgressUpdate = TablesUpdate<'section_progress'>
export type QuestionUpdate = TablesUpdate<'questions'>
export type ExamUpdate = TablesUpdate<'exams'>

// Enums
export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin'
export type QuestionType = 'mcq' | 'coding' | 'essay' | 'file_upload' | 'true_false' | 'fill_blank' | 'matching'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'dropped' | 'suspended'
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'cancelled'
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'exam' | 'course' | 'system' | 'assignment'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
