import { createClient } from '@supabase/supabase-js';

// Buraya kendi proje bilgilerini yapıştırdığından emin ol
const supabaseUrl = 'https://awaexyphovhqsquulllu.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWV4eXBob3ZocXNxdXVsbGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTgzMTMsImV4cCI6MjA4NjUzNDMxM30.VJw3zJ3fhkc73MkWuItRgWyHzl6BwGpdcjaYBsrCc8o';

export const supabase = createClient(supabaseUrl, supabaseKey);
