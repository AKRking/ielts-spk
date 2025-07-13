/*
  # IELTS Speaking Questions Database Schema

  1. New Tables
    - `ielts_questions`
      - `id` (uuid, primary key)
      - `serial_number` (integer, unique)
      - `part` (integer, 1-3 for IELTS parts)
      - `category` (text, question category)
      - `question` (text, the actual question)
      - `sample_answer` (text, model answer)
      - `key_vocabulary` (text array, important words/phrases)
      - `time_limit` (integer, seconds)
      - `created_at` (timestamp)
    
    - `user_recordings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `question_id` (uuid, references ielts_questions)
      - `audio_url` (text, Supabase storage URL)
      - `duration` (integer, recording length in seconds)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Public read access for questions, private recordings
*/

-- IELTS Questions table
CREATE TABLE IF NOT EXISTS ielts_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number integer UNIQUE NOT NULL,
  part integer NOT NULL CHECK (part IN (1, 2, 3)),
  category text NOT NULL,
  question text NOT NULL,
  sample_answer text NOT NULL,
  key_vocabulary text[] DEFAULT '{}',
  time_limit integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User recordings table
CREATE TABLE IF NOT EXISTS user_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  question_id uuid REFERENCES ielts_questions(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ielts_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recordings ENABLE ROW LEVEL SECURITY;

-- Questions are publicly readable
CREATE POLICY "Questions are publicly readable"
  ON ielts_questions
  FOR SELECT
  TO public
  USING (true);

-- Users can manage their own recordings
CREATE POLICY "Users can manage own recordings"
  ON user_recordings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample IELTS questions
INSERT INTO ielts_questions (serial_number, part, category, question, sample_answer, key_vocabulary, time_limit) VALUES
(1, 1, 'Personal Information', 'Can you tell me about your hometown?', 'I come from a vibrant city called Manchester in the north of England. It''s a bustling metropolitan area known for its rich industrial heritage and thriving cultural scene. The city has excellent transport links and is home to two famous football clubs. What I particularly love about my hometown is the friendly atmosphere and the diverse range of activities available, from world-class museums to lively music venues.', ARRAY['vibrant', 'bustling', 'metropolitan', 'heritage', 'thriving', 'diverse'], 90),

(2, 1, 'Daily Routine', 'What do you usually do in the evenings?', 'My evening routine varies depending on the day, but I typically like to unwind after work by either reading a good book or watching documentaries. I find this helps me relax and expand my knowledge at the same time. On weekends, I might meet friends for dinner or attend cultural events like concerts or theater performances. I also enjoy cooking elaborate meals when I have more time available.', ARRAY['unwind', 'elaborate', 'cultural events', 'expand knowledge', 'documentaries'], 90),

(3, 2, 'Describe', 'Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how this skill would benefit you.', 'I would really love to learn photography, particularly landscape and portrait photography. This skill has always fascinated me because it combines technical knowledge with artistic creativity. I''m drawn to the idea of capturing meaningful moments and beautiful scenes that can evoke emotions in viewers. To learn this skill, I would start by taking a comprehensive online course covering camera settings, composition techniques, and lighting principles. I''d also practice regularly by taking photos in different environments and seeking feedback from experienced photographers. The benefits would be numerous - not only would it provide a creative outlet and potential source of income, but it would also encourage me to explore new places and see the world from a different perspective. Additionally, photography skills are increasingly valuable in today''s digital age for personal branding and social media presence.', ARRAY['fascinating', 'technical knowledge', 'artistic creativity', 'evoke emotions', 'comprehensive', 'composition techniques', 'creative outlet', 'digital age'], 120),

(4, 1, 'Technology', 'How often do you use social media?', 'I use social media quite regularly, probably checking various platforms about 3-4 times throughout the day. I mainly use it to stay connected with friends and family, especially those who live far away. I also follow news outlets and educational accounts to stay informed about current events and learn new things. However, I try to be mindful about my usage and avoid endless scrolling, as I believe it''s important to maintain a healthy balance between online and offline activities.', ARRAY['regularly', 'stay connected', 'current events', 'mindful', 'endless scrolling', 'healthy balance'], 90),

(5, 3, 'Technology', 'What impact has technology had on the way people communicate?', 'Technology has revolutionized human communication in unprecedented ways. On the positive side, it has made global communication instantaneous and affordable, allowing people to maintain relationships across vast distances through video calls, messaging apps, and social platforms. This has particularly benefited businesses, enabling remote work and international collaboration. However, there are concerning trends as well. Face-to-face communication skills may be deteriorating, especially among younger generations who grew up with digital communication. The quality of conversations has sometimes suffered due to the brevity required by platforms like Twitter, and the nuance of human emotion can be lost in text-based communication. Furthermore, the constant connectivity can lead to communication overload and decreased attention spans. Overall, while technology has enhanced our ability to connect, we must be conscious of maintaining authentic, meaningful communication practices.', ARRAY['revolutionized', 'unprecedented', 'instantaneous', 'vast distances', 'deteriorating', 'brevity', 'nuance', 'overload', 'authentic'], 180);