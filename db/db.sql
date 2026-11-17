-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: trackbox_v2
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `affiliate_referrals`
--

DROP TABLE IF EXISTS `affiliate_referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliate_referrals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `affiliate_id` int DEFAULT NULL,
  `referred_business_id` int DEFAULT NULL,
  `commission` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `affiliate_id` (`affiliate_id`),
  CONSTRAINT `affiliate_referrals_ibfk_1` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliate_referrals`
--

LOCK TABLES `affiliate_referrals` WRITE;
/*!40000 ALTER TABLE `affiliate_referrals` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliate_referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `affiliates`
--

DROP TABLE IF EXISTS `affiliates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `referral_code` varchar(20) DEFAULT NULL,
  `total_referrals` int DEFAULT '0',
  `total_earnings` decimal(10,2) DEFAULT '0.00',
  `pending_payout` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `referral_code` (`referral_code`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `affiliates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliates`
--

LOCK TABLES `affiliates` WRITE;
/*!40000 ALTER TABLE `affiliates` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics`
--

DROP TABLE IF EXISTS `analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `metric_type` varchar(100) DEFAULT NULL,
  `metric_value` decimal(15,2) DEFAULT NULL,
  `dimension` varchar(100) DEFAULT NULL,
  `recorded_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `analytics_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics`
--

LOCK TABLES `analytics` WRITE;
/*!40000 ALTER TABLE `analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_history`
--

DROP TABLE IF EXISTS `application_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `application_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `application_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_history`
--

LOCK TABLES `application_history` WRITE;
/*!40000 ALTER TABLE `application_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_status_change`
--

DROP TABLE IF EXISTS `application_status_change`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_status_change` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `status_change_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `old_status_id` int DEFAULT NULL,
  `old_status_name` varchar(255) DEFAULT NULL,
  `new_status_id` int DEFAULT NULL,
  `new_status_name` varchar(255) DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `application_status_change_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `application_status_change_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_change`
--

LOCK TABLES `application_status_change` WRITE;
/*!40000 ALTER TABLE `application_status_change` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_status_change` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_statuses`
--

DROP TABLE IF EXISTS `application_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '#475569',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `application_statuses_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_statuses`
--

LOCK TABLES `application_statuses` WRITE;
/*!40000 ALTER TABLE `application_statuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_years`
--

DROP TABLE IF EXISTS `application_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `year` varchar(4) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `application_years_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_years`
--

LOCK TABLES `application_years` WRITE;
/*!40000 ALTER TABLE `application_years` DISABLE KEYS */;
/*!40000 ALTER TABLE `application_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `country` varchar(255) NOT NULL,
  `university` varchar(255) NOT NULL,
  `course` varchar(255) NOT NULL,
  `intake_id` int DEFAULT NULL,
  `year_id` int DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `contact_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `intake_id` (`intake_id`),
  KEY `status_id` (`status_id`),
  KEY `created_by` (`created_by`),
  KEY `applications_ibfk_3` (`year_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`intake_id`) REFERENCES `intakes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`year_id`) REFERENCES `years` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_ibfk_4` FOREIGN KEY (`status_id`) REFERENCES `application_statuses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `applications_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `menu` enum('lead','crm','operation','hr') DEFAULT NULL,
  `check_in_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `check_out_time` timestamp NULL DEFAULT NULL,
  `total_minutes` int DEFAULT NULL,
  `is_late` tinyint(1) DEFAULT '0',
  `late_reason` text,
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'ufs',NULL,NULL,NULL,'2026-11-17 08:30:10','2026-11-17 08:30:10');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcast_logs`
--

DROP TABLE IF EXISTS `broadcast_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcast_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `broadcast_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'sent',
  `wa_message_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `broadcast_id` (`broadcast_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `broadcast_logs_ibfk_1` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcasts` (`id`),
  CONSTRAINT `broadcast_logs_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcast_logs`
--

LOCK TABLES `broadcast_logs` WRITE;
/*!40000 ALTER TABLE `broadcast_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcast_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcasts`
--

DROP TABLE IF EXISTS `broadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `template_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `target_tags` json DEFAULT NULL,
  `target_contact_ids` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_recipients` int DEFAULT '0',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read` int DEFAULT '0',
  `total_failed` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `broadcasts_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcasts`
--

LOCK TABLES `broadcasts` WRITE;
/*!40000 ALTER TABLE `broadcasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `businesses`
--

DROP TABLE IF EXISTS `businesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `businesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `fb_page_id` varchar(100) DEFAULT NULL,
  `ig_account_id` varchar(100) DEFAULT NULL,
  `whatsapp_token` text,
  `whatsapp_phone_id` varchar(100) DEFAULT NULL,
  `fb_verify_token` varchar(100) DEFAULT NULL,
  `plan` enum('starter','pro','enterprise') DEFAULT 'starter',
  `green_tick_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `company_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,'Demo Business','+15556377030',NULL,NULL,NULL,NULL,NULL,'pro','verified','2026-11-11 07:08:03',NULL),(6,'Demo Business','+911234567890',NULL,NULL,NULL,NULL,NULL,'pro','pending','2026-11-11 06:48:35',NULL);
/*!40000 ALTER TABLE `businesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channels`
--

DROP TABLE IF EXISTS `channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_business_channel` (`business_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channels`
--

LOCK TABLES `channels` WRITE;
/*!40000 ALTER TABLE `channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbot_sessions`
--

DROP TABLE IF EXISTS `chatbot_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbot_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatbot_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `current_node_id` varchar(100) DEFAULT NULL,
  `session_data` json DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `chatbot_sessions_ibfk_1` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbots` (`id`),
  CONSTRAINT `chatbot_sessions_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbot_sessions`
--

LOCK TABLES `chatbot_sessions` WRITE;
/*!40000 ALTER TABLE `chatbot_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatbot_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbots`
--

DROP TABLE IF EXISTS `chatbots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatbots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `trigger_keywords` json DEFAULT NULL,
  `flow` json DEFAULT NULL,
  `ai_enabled` tinyint(1) DEFAULT '0',
  `openai_system_prompt` text,
  `is_active` tinyint(1) DEFAULT '1',
  `channel` varchar(100) DEFAULT 'whatsapp',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `chatbots_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbots`
--

LOCK TABLES `chatbots` WRITE;
/*!40000 ALTER TABLE `chatbots` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatbots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_config`
--

DROP TABLE IF EXISTS `company_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `is_email` tinyint(1) DEFAULT '0',
  `logo` varchar(500) DEFAULT NULL,
  `favicon` varchar(500) DEFAULT NULL,
  `company_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_config`
--

LOCK TABLES `company_config` WRITE;
/*!40000 ALTER TABLE `company_config` DISABLE KEYS */;
INSERT INTO `company_config` VALUES (4,'Trackbox','Trackbox CRM',0,'assets/logos/trackbox-logo.png','assets/icons/trackbox-logo.png',0),(5,'Choice','Choice CRM',1,'assets/logos/choice-logo.png','assets/icons/choice-icon.png',1);
/*!40000 ALTER TABLE `company_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_custom_values`
--

DROP TABLE IF EXISTS `contact_custom_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_custom_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `field_id` int NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_contact_field` (`contact_id`,`field_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `contact_custom_values_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `lead_fields` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_custom_values_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_custom_values`
--

LOCK TABLES `contact_custom_values` WRITE;
/*!40000 ALTER TABLE `contact_custom_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_custom_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_history`
--

DROP TABLE IF EXISTS `contact_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contact_history_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_history_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_history_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_history`
--

LOCK TABLES `contact_history` WRITE;
/*!40000 ALTER TABLE `contact_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_qualifications`
--

DROP TABLE IF EXISTS `contact_qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_qualifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `qualification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `completion_year` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentage_cgpa` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `backlogs` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '0',
  `study_gap` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_highest` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qualifications_contact` (`contact_id`),
  KEY `idx_qualifications_business` (`business_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contact_qualifications_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_qualifications_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_qualifications_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_qualifications`
--

LOCK TABLES `contact_qualifications` WRITE;
/*!40000 ALTER TABLE `contact_qualifications` DISABLE KEYS */;
INSERT INTO `contact_qualifications` VALUES (1,366,1,'bcs','kerala','2345','90','0','2',1,1,70,'2026-11-17 09:03:31','2026-11-17 09:04:28'),(2,366,1,'10','kerala','2025','999','0','1',0,0,70,'2026-11-17 09:03:53','2026-11-17 09:04:28');
/*!40000 ALTER TABLE `contact_qualifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_tasks`
--

DROP TABLE IF EXISTS `contact_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `contact_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `contact_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `dept_id` int DEFAULT NULL,
  `dept_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `assigned_to` int NOT NULL,
  `assigned_to_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_by` int NOT NULL,
  `created_by_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0: Pending, 1: Completed',
  `is_task_date` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0: Disabled, 1: Enabled',
  `task_date` date DEFAULT NULL COMMENT 'Promised submission date',
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_branch_id` (`branch_id`),
  KEY `idx_dept_id` (`dept_id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_status` (`status`),
  KEY `idx_task_date` (`task_date`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_tasks`
--

LOCK TABLES `contact_tasks` WRITE;
/*!40000 ALTER TABLE `contact_tasks` DISABLE KEYS */;
INSERT INTO `contact_tasks` VALUES (1,366,'Anas','918592873809',1,'ufs',1,'test','g','g',502,'Priya Sharma',70,'Administrator',0,1,'2026-11-17',NULL,'2026-11-17 09:08:16','2026-11-17 09:08:38'),(2,366,'Anas','918592873809',1,'ufs',1,'test','g','g',70,'Administrator',70,'Administrator',0,1,'2026-11-17',NULL,'2026-11-17 10:33:53','2026-11-17 10:41:16'),(3,366,'Anas','918592873809',1,'ufs',1,'test','t','t',70,'Administrator',70,'Administrator',0,1,'2026-11-18',NULL,'2026-11-17 10:34:09','2026-11-17 10:41:13'),(4,366,'Anas','918592873809',1,'ufs',1,'test','tgt','gtg',70,'Administrator',70,'Administrator',0,1,'2026-11-19',NULL,'2026-11-17 10:34:22','2026-11-17 10:34:22'),(5,366,'Anas','918592873809',1,'ufs',1,'test','j','h',70,'Administrator',70,'Administrator',0,0,NULL,NULL,'2026-11-17 10:43:09','2026-11-17 10:43:09'),(6,365,'Abhijith Siju','918943391979',1,'ufs',1,'test','testq','test',70,'Administrator',70,'Administrator',1,1,'2026-11-10','2026-11-17 16:16:03','2026-11-17 10:45:44','2026-11-17 10:46:03'),(7,365,'Abhijith Siju','918943391979',1,'ufs',1,'test','vv','cs',70,'Administrator',70,'Administrator',0,1,'2026-11-17',NULL,'2026-11-17 10:46:00','2026-11-17 10:46:00'),(8,366,'Anas','918592873809',1,'ufs',1,'test','t1','t1',70,'Administrator',70,'Administrator',0,1,'2026-11-01',NULL,'2026-11-17 10:48:32','2026-11-17 10:48:32');
/*!40000 ALTER TABLE `contact_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_work_experiences`
--

DROP TABLE IF EXISTS `contact_work_experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_work_experiences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `employer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `experience` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_work_exp_contact` (`contact_id`),
  KEY `idx_work_exp_business` (`business_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contact_work_experiences_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_work_experiences_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_work_experiences_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_work_experiences`
--

LOCK TABLES `contact_work_experiences` WRITE;
/*!40000 ALTER TABLE `contact_work_experiences` DISABLE KEYS */;
INSERT INTO `contact_work_experiences` VALUES (1,366,1,'test','test','','1111-11-11',NULL,1,0,70,'2026-11-17 09:05:10','2026-11-17 09:05:10');
/*!40000 ALTER TABLE `contact_work_experiences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `email` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `opted_in` tinyint(1) DEFAULT '0',
  `opt_in_date` timestamp NULL DEFAULT NULL,
  `opt_out_date` timestamp NULL DEFAULT NULL,
  `opt_in_source` enum('manual','link','whatsapp','import') DEFAULT 'manual',
  `channel_preference` varchar(100) DEFAULT 'whatsapp',
  `has_unread_wa` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_to` int DEFAULT NULL,
  `address` text,
  `enquiry_for_id` int DEFAULT NULL,
  `loss_reason` varchar(255) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `follow_up_count` int DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `follow_up` tinyint(1) DEFAULT '0',
  `sale_won` tinyint(1) DEFAULT '0',
  `sale_won_date` datetime DEFAULT NULL,
  `sale_won_by` int DEFAULT NULL,
  `sale_lost` tinyint(1) DEFAULT '0',
  `sale_lost_date` datetime DEFAULT NULL,
  `sale_lost_by` int DEFAULT NULL,
  `created_by_user` int DEFAULT NULL,
  `user_list` json DEFAULT NULL,
  `priority` enum('High','Medium','Low') DEFAULT NULL,
  `probability_id` int DEFAULT NULL,
  `current_sale_status` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_contacts_assigned_to` (`assigned_to`),
  KEY `fk_contacts_enquiry_for` (`enquiry_for_id`),
  KEY `fk_contacts_probability` (`probability_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `fk_contacts_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_enquiry_for` FOREIGN KEY (`enquiry_for_id`) REFERENCES `enquiry_fors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contacts_probability` FOREIGN KEY (`probability_id`) REFERENCES `probabilities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=367 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (245,1,'Anil Paul','918086041647','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-10-20 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(246,1,'Christy Thomas','917012759032','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-10-22 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(247,1,'Mereena Sebastian','918593949792','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-10-23 18:30:00',502,'Manickamangalam',NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(248,1,'Arya Unni','919207455251','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-10-24 18:30:00',502,'Okkal',NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(249,1,'Anju Shaibu','919207029389','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-10-24 18:30:00',502,'Neeleeswaram',NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(250,1,'Mathews P Cheriyan','918330029196','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-10-24 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(251,1,'Melvin Michael','918606039481','+91',NULL,'[]',0,NULL,NULL,'import','New Call',0,'2025-10-24 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(252,1,'Stefin Father','918921288868','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(253,1,'Alisha Jose','919946627099','+91',NULL,'[]',0,NULL,NULL,'import','New Call',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(254,1,'Dona Mary Davis','916238275944','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(255,1,'Anna K Thomas','919544369627','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-11-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(256,1,'Albin Nixon','919072633714','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-11-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(257,1,'Amal Krishna Pradeep','918075410272','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-11-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(258,1,'Christo','919745725409','+91',NULL,'[]',0,NULL,NULL,'import','Reference Walkin',0,'2025-11-17 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(259,1,'Anto','917025582957','+91',NULL,'[]',0,NULL,NULL,'import','Reference Walkin',0,'2025-11-17 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(260,1,'Saju (Wife Soumya)','919605351939','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-11-21 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(261,1,'Akhila','919846398306','+91',NULL,'[]',0,NULL,NULL,'import','New Call',0,'2025-11-24 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(262,1,'Jelin','917025787305','+91',NULL,'[]',0,NULL,NULL,'import','New Call',0,'2025-11-30 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(263,1,'Jithin Kunjumon','917306876153','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-11-30 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(264,1,'Albin Mathew','917736804609','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-12-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(265,1,'Avitha','917034214892','+91',NULL,'[]',0,NULL,NULL,'import','New Call',0,'2025-12-03 18:30:00',502,'Thrissur',NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(266,1,'Nithul Biju','919947107688','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-12-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(267,1,'Aldrin Wilson','918590960749','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2025-12-12 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(268,1,'Jomel P Sasi','919746802512','+91',NULL,'[]',0,NULL,NULL,'import','Reference Walkin',0,'2025-12-16 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(269,1,'Midhu','917510720372','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-12-18 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(270,1,'Bibin Baby','918891301607','+91',NULL,'[]',0,NULL,NULL,'import','New Call',0,'2025-12-18 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(271,1,'Nithin','916235054380','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-12-28 18:30:00',502,'Chalakudy',NULL,NULL,1,'ufs',1,'test',1,'	New Lead',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(272,1,'Pournamy V S','919947953642','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2025-12-31 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(273,1,'Jithin','917559936024','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2026-01-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',0,'2026-11-17',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,70,'[502]',NULL,NULL,1),(274,1,'Alan M V','918714368015','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-01-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(275,1,'Veronica K','917902790819','+91',NULL,'[]',0,NULL,NULL,'import','Instagram AD',0,'2026-01-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(276,1,'Swetha Reji','917356100242','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2026-01-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(277,1,'Kishore','918281882297','+91',NULL,'[]',0,NULL,NULL,'import','Reference Walkin',0,'2026-01-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',9,'Application Submitted',0,'2026-11-17',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,70,'[502]',NULL,NULL,1),(278,1,'Alen Sabu','917907699924','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-01-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',11,'Application Drafted',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(279,1,'Reshmy','919946623909','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-01-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(280,1,'Simil Benny','918139014854','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-01-08 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(281,1,'Jeswin Shaju','916238139781','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-01-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(282,1,'Parvathy Poulouse','919562629824','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-01-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(283,1,'Ann Mariya Devassy','919207393002','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-01-31 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(284,1,'Mariya','917025652243','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(285,1,'Parvathy','918075421319','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',13,'Lost / Diverted',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(286,1,'Alex Babu','917306760857','+91',NULL,'[]',0,NULL,NULL,'import','Call Walkin',0,'2026-02-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',12,'Follow Up',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(287,1,'Jisiya','919544075107','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(288,1,'Athul Roy','919745824639','+91',NULL,'[]',0,NULL,NULL,'import','Direct Walkin',0,'2026-02-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(289,1,'Festin Francis','918136847799','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(290,1,'Arjun Saji','917907970712','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(291,1,'Amal Eldhose','919656917369','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-08 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(292,1,'Sujay Anil','916238921929','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',0,'2026-11-17',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,70,'[502]',NULL,NULL,1),(293,1,'Antonio','919995136859','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(294,1,'Shahin','917293043123','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-11 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(295,1,'Adarsh','917561806345','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-12 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(296,1,'Nash A O','919207053054','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-13 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(297,1,'Reebish Santhosh','919995259776','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-14 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(298,1,'Aparna Alias','918590470630','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-15 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',0,'2026-11-17',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,70,'[502]',NULL,NULL,1),(299,1,'Nibin John','918089634476','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-02-28 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',0,'2026-11-17',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,70,'[502]',NULL,NULL,1),(300,1,'Nakul Gopinath','918848528025','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-03-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(301,1,'Eldho George','919496336332','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-03-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(302,1,'Josiya','918157085147','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-03-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',10,'Visa Stage',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(303,1,'Neena Mathew','918111938061','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-03-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(304,1,'Dhiya Rose','917356749374','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-03-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(305,1,'Sherine Shaju','917736097450','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-03-31 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(306,1,'Renjith T.A','917994242294','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-04-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(307,1,'Charles George','916235928027','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-04-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(308,1,'John Peter','918921319217','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-04-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(309,1,'Akash','918985964850','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-04-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(310,1,'Silpa','918921588848','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-04-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(311,1,'Maria Rose Joy','916238199308','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-04-30 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(312,1,'Sujil Mathew','919495539298','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(313,1,'Sanju Sabu','919946613952','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(314,1,'Jerin Joy','917306072036','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',5,'No Response',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(315,1,'Dini K Davis','919947343239','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',3,'Lost',0,'2026-11-17',1,0,NULL,NULL,1,'2026-11-17 14:01:00',502,70,'[502]',NULL,NULL,2),(316,1,'Emmanuel Xavier','919188105919','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(317,1,'Anette Joy','918848922735','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(318,1,'Christal Biju','918606074191','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(319,1,'Tom Sebastian','917594914948','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-08 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',8,'Decision Pending',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(320,1,'Athul Pramond','918089994154','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',6,'	Proceeding',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(321,1,'Mohammed Shanif','917561034827','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(322,1,'Alen Mathew Paul','918129195563','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-11 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(323,1,'Anjana Suku','919995117694','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-12 18:30:00',502,'Georgia',NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(324,1,'Devika PV','917736241897','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-13 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(325,1,'Ananthu MK','918075531696','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-14 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(326,1,'Mebin Benny','917510151304','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-15 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(327,1,'Sanjay Krishna','919486711487','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-16 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(328,1,'Jezebel Merlin','919995366699','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-05-31 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(329,1,'Grace Helen','916235681421','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(330,1,'Dinu Denny','916282373018','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(331,1,'Mariya Sony','919744467561','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',10,'Visa Stage',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(332,1,'Aleena Biju','917025486201','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(333,1,'Benjammin Benny','917306480425','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(334,1,'Prince Cleetus','916238719423','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(335,1,'Heaven Christo','919567715403','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(336,1,'Darsana C.S','919562941995','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-06-30 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(337,1,'Andriya Baby','918848918012','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(338,1,'Denil K Thoman','919447015393','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(339,1,'Ananya Shijo','919142131108','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(340,1,'John Saju','918590499317','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(341,1,'Gaius Rajan','919447362491','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(342,1,'Wilston P Wilson','917736412437','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(343,1,'Niya Tomy','918547736939','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-08 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(344,1,'Sial P Raju','919961108841','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(345,1,'Sanoop Babu','917306028646','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(346,1,'Jerin Joy','919633270255','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-07-11 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(347,1,'Dhanya Louis','919946980757','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-08-31 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',4,'Pending Documents',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(348,1,'Aswin Shaji','916282704096','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-01 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',7,'Offer Received',0,'2026-11-17',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,70,'[502]',NULL,NULL,1),(349,1,'Rose Mary Benny','916235768247','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-02 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(350,1,'Sneha Mary Varghese','917028713469','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-03 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(351,1,'Libin Joseph','918281065205','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-04 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(352,1,'Abhiesk A','919633785881','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-05 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(353,1,'Kavya Murali','918590337710','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-06 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(354,1,'Tinu Yohannan','918606019562','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-07 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(355,1,'Namrutha P','919544758662','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-08 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(356,1,'Mary Anjana Antony','919061660862','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-09 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(357,1,'Akshay Rajendran','919207926995','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-10 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(358,1,'Dibin Biju','919846079560','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-11 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(359,1,'Denil Joy','918304010349','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-12 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(360,1,'Aparna V','919061433009','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-13 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(361,1,'Melissa Jaiby','916363689904','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-14 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(362,1,'Balamuralikrishna','919746380879','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-15 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(363,1,'Nandana Surendran','918086836374','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-16 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(364,1,'Albin Reji','919995154072','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-17 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(365,1,'Abhijith Siju','918943391979','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-18 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0),(366,1,'Anas','918592873809','+91',NULL,'[]',0,NULL,NULL,'import','Unknown',0,'2026-09-19 18:30:00',502,NULL,NULL,NULL,1,'ufs',1,'test',2,'In Progress',0,'2026-11-17',1,0,NULL,NULL,0,NULL,NULL,70,'[502]',NULL,NULL,0);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `channel` varchar(100) DEFAULT 'whatsapp',
  `status` enum('open','resolved','pending') DEFAULT 'open',
  `assigned_to` int DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `social_account_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `fk_conversations_social_account` (`social_account_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`),
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_conversations_social_account` FOREIGN KEY (`social_account_id`) REFERENCES `social_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `country_codes`
--

DROP TABLE IF EXISTS `country_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `country_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `iso_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_length` int DEFAULT '10',
  `min_length` int DEFAULT '7',
  `max_length` int DEFAULT '15',
  `flag_emoji` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `is_default` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '100',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_country_iso` (`country_name`,`iso_code`),
  KEY `idx_code` (`country_code`),
  KEY `idx_iso` (`iso_code`),
  KEY `idx_sort` (`sort_order`,`country_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `country_codes`
--

LOCK TABLES `country_codes` WRITE;
/*!40000 ALTER TABLE `country_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `country_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_help_videos`
--

DROP TABLE IF EXISTS `crm_help_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_help_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'CRM Workflow & Tutorial Guide',
  `description` text,
  `video_url` varchar(1000) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_help_biz` (`business_id`),
  CONSTRAINT `crm_help_videos_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `crm_help_videos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_help_videos`
--

LOCK TABLES `crm_help_videos` WRITE;
/*!40000 ALTER TABLE `crm_help_videos` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_help_videos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctwa_clicks`
--

DROP TABLE IF EXISTS `ctwa_clicks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctwa_clicks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link_id` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `referrer` varchar(500) DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `link_id` (`link_id`),
  CONSTRAINT `ctwa_clicks_ibfk_1` FOREIGN KEY (`link_id`) REFERENCES `ctwa_links` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctwa_clicks`
--

LOCK TABLES `ctwa_clicks` WRITE;
/*!40000 ALTER TABLE `ctwa_clicks` DISABLE KEYS */;
/*!40000 ALTER TABLE `ctwa_clicks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctwa_links`
--

DROP TABLE IF EXISTS `ctwa_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctwa_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `pre_filled_message` text,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `short_code` varchar(20) DEFAULT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `click_count` int DEFAULT '0',
  `conversation_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_code` (`short_code`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `ctwa_links_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctwa_links`
--

LOCK TABLES `ctwa_links` WRITE;
/*!40000 ALTER TABLE `ctwa_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `ctwa_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,'test',NULL,'2026-11-17 08:30:18','2026-11-17 08:30:18');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `designations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `document_types_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drip_campaigns`
--

DROP TABLE IF EXISTS `drip_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drip_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `steps` json DEFAULT NULL,
  `trigger_event` varchar(100) DEFAULT NULL,
  `trigger_tags` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `drip_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drip_campaigns`
--

LOCK TABLES `drip_campaigns` WRITE;
/*!40000 ALTER TABLE `drip_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `drip_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drip_enrollments`
--

DROP TABLE IF EXISTS `drip_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drip_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `current_step` int DEFAULT '0',
  `next_send_at` timestamp NULL DEFAULT NULL,
  `status` enum('active','completed','stopped') DEFAULT 'active',
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `drip_enrollments_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `drip_campaigns` (`id`),
  CONSTRAINT `drip_enrollments_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drip_enrollments`
--

LOCK TABLES `drip_enrollments` WRITE;
/*!40000 ALTER TABLE `drip_enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `drip_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_for_options`
--

DROP TABLE IF EXISTS `enquiry_for_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiry_for_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `enquiry_for_options_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_for_options`
--

LOCK TABLES `enquiry_for_options` WRITE;
/*!40000 ALTER TABLE `enquiry_for_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_for_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiry_fors`
--

DROP TABLE IF EXISTS `enquiry_fors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquiry_fors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `enquiry_fors_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_fors`
--

LOCK TABLES `enquiry_fors` WRITE;
/*!40000 ALTER TABLE `enquiry_fors` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiry_fors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `field_categories`
--

DROP TABLE IF EXISTS `field_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `field_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `field_categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `field_categories`
--

LOCK TABLES `field_categories` WRITE;
/*!40000 ALTER TABLE `field_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `field_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_ups`
--

DROP TABLE IF EXISTS `follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_ups` (
  `follow_up_id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `entry_date_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `by_user_id` int DEFAULT NULL,
  `by_user_name` varchar(255) DEFAULT NULL,
  `to_user_id` int DEFAULT NULL,
  `to_user_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`follow_up_id`),
  KEY `fk_contact_followup_contact` (`contact_id`),
  CONSTRAINT `fk_contact_followup_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=367 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` VALUES (245,245,'Anil Paul','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(246,246,'Christy Thomas','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(247,247,'Mereena Sebastian','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(248,248,'Arya Unni','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(249,249,'Anju Shaibu','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(250,250,'Mathews P Cheriyan','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(251,251,'Melvin Michael','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(252,252,'Stefin Father','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(253,253,'Alisha Jose','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(254,254,'Dona Mary Davis','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(255,255,'Anna K Thomas','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(256,256,'Albin Nixon','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(257,257,'Amal Krishna Pradeep','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(258,258,'Christo','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(259,259,'Anto','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(260,260,'Saju (Wife Soumya)','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(261,261,'Akhila','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(262,262,'Jelin','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(263,263,'Jithin Kunjumon','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(264,264,'Albin Mathew','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(265,265,'Avitha','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(266,266,'Nithul Biju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(267,267,'Aldrin Wilson','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(268,268,'Jomel P Sasi','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(269,269,'Midhu','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(270,270,'Bibin Baby','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(271,271,'Nithin','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',1,'	New Lead',1,'ufs',1,'test','new'),(272,272,'Pournamy V S','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Waiting for documents; still asking for 3rd party arrangement for finance'),(273,273,'Jithin','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test','Application submitted'),(274,274,'Alan M V','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Will come on Monday directly; shared UCOL details, waiting for documents'),(275,275,'Veronica K','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Application moved - waiting for offer letter; not interested'),(276,276,'Swetha Reji','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','Still no reply from candidate'),(277,277,'Kishore','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',9,'Application Submitted',1,'ufs',1,'test','Submitted application to NZSE Masters in Data'),(278,278,'Alen Sabu','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',11,'Application Drafted',1,'ufs',1,'test','Application drafted'),(279,279,'Reshmy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Aswathy handling - waiting to receive documents'),(280,280,'Simil Benny','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested in Health Care Certificate Program Level 4'),(281,281,'Jeswin Shaju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested in Health Care Certificate Program Level 5'),(282,282,'Parvathy Poulouse','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(283,283,'Ann Mariya Devassy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Given for conditional / declined; now given for diploma'),(284,284,'Mariya','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Details shared MBIL & Masters in Business Intelligence; collected all documents'),(285,285,'Parvathy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',13,'Lost / Diverted',1,'ufs',1,'test','Looking for Germany; not that much interested in NZ'),(286,286,'Alex Babu','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',12,'Follow Up',1,'ufs',1,'test','12th 2021 BioMaths 84%, B.Tech dropped, B.Com 22-25 58%, MBA 2027. NR 21-1 doubts on ITR. Will come on Saturday'),(287,287,'Jisiya','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',8,'Decision Pending',1,'ufs',1,'test','Decision pending'),(288,288,'Athul Roy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','BA LLB 2023, Safety Officer STED Council, working Doha. NR 16-2, No response 2-6, 24-6 call disconnected'),(289,289,'Festin Francis','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',8,'Decision Pending',1,'ufs',1,'test','Decision pending; fund issue'),(290,290,'Arjun Saji','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Waiting for his update'),(291,291,'Amal Eldhose','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested but needs time to confirm'),(292,292,'Sujay Anil','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Unconditional offer letter received'),(293,293,'Antonio','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','Not responding'),(294,294,'Shahin','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Shared documents, waiting for degree certificate'),(295,295,'Adarsh','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(296,296,'Nash A O','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(297,297,'Reebish Santhosh','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Course details shared'),(298,298,'Aparna Alias','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Received offer from NZSE'),(299,299,'Nibin John','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Received offer from SIT; still interested in NZSE Addiction Diploma (2 offers received)'),(300,300,'Nakul Gopinath','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Offer letter waiting'),(301,301,'Eldho George','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Back out case - age limit'),(302,302,'Josiya','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',10,'Visa Stage',1,'ufs',1,'test','Offer letter received; waiting for visa submission'),(303,303,'Neena Mathew','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Interested in MBIL and NZSE; shared details'),(304,304,'Dhiya Rose','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(305,305,'Sherine Shaju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','No response 24-6. 12th 2026 78%, going for IELTS; moved UK with other agency'),(306,306,'Renjith T.A','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(307,307,'Charles George','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(308,308,'John Peter','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(309,309,'Akash','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(310,310,'Silpa','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(311,311,'Maria Rose Joy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Moved Australia through other agency'),(312,312,'Sujil Mathew','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Course options shared, not interested'),(313,313,'Sanju Sabu','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Not proceeding to abroad education'),(314,314,'Jerin Joy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',5,'No Response',1,'ufs',1,'test','No response to call'),(315,315,'Dini K Davis','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',3,'Lost',1,'ufs',1,'test','Not proceeding to abroad education'),(316,316,'Emmanuel Xavier','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(317,317,'Anette Joy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(318,318,'Christal Biju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(319,319,'Tom Sebastian','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',8,'Decision Pending',1,'ufs',1,'test','Decision pending'),(320,320,'Athul Pramond','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',6,'	Proceeding',1,'ufs',1,'test','Proceeding'),(321,321,'Mohammed Shanif','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(322,322,'Alen Mathew Paul','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(323,323,'Anjana Suku','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Country interest: Georgia'),(324,324,'Devika PV','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(325,325,'Ananthu MK','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(326,326,'Mebin Benny','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(327,327,'Sanjay Krishna','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(328,328,'Jezebel Merlin','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(329,329,'Grace Helen','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(330,330,'Dinu Denny','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(331,331,'Mariya Sony','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',10,'Visa Stage',1,'ufs',1,'test','Visa proceeding; contacted by Josmi - NZSE'),(332,332,'Aleena Biju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(333,333,'Benjammin Benny','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(334,334,'Prince Cleetus','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(335,335,'Heaven Christo','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(336,336,'Darsana C.S','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(337,337,'Andriya Baby','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(338,338,'Denil K Thoman','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(339,339,'Ananya Shijo','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(340,340,'John Saju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(341,341,'Gaius Rajan','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(342,342,'Wilston P Wilson','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(343,343,'Niya Tomy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(344,344,'Sial P Raju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(345,345,'Sanoop Babu','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(346,346,'Jerin Joy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(347,347,'Dhanya Louis','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',4,'Pending Documents',1,'ufs',1,'test','Documents not received'),(348,348,'Aswin Shaji','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',7,'Offer Received',1,'ufs',1,'test','Offer received'),(349,349,'Rose Mary Benny','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(350,350,'Sneha Mary Varghese','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(351,351,'Libin Joseph','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(352,352,'Abhiesk A','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(353,353,'Kavya Murali','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(354,354,'Tinu Yohannan','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(355,355,'Namrutha P','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(356,356,'Mary Anjana Antony','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(357,357,'Akshay Rajendran','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(358,358,'Dibin Biju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(359,359,'Denil Joy','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(360,360,'Aparna V','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(361,361,'Melissa Jaiby','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(362,362,'Balamuralikrishna','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(363,363,'Nandana Surendran','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new'),(364,364,'Albin Reji','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Country interest: Germany'),(365,365,'Abhijith Siju','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','Country interest: Germany'),(366,366,'Anas','2026-11-17','2026-11-17 14:00:59',70,'Administrator',502,'Priya Sharma',2,'In Progress',1,'ufs',1,'test','new');
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imported_leads`
--

DROP TABLE IF EXISTS `imported_leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imported_leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `import_batch_id` varchar(64) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT '+91',
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `tags` json DEFAULT NULL,
  `opt_in_source` varchar(50) DEFAULT 'import',
  `channel_preference` varchar(100) DEFAULT 'whatsapp',
  `source` varchar(100) DEFAULT NULL,
  `enquiry_for_id` int DEFAULT NULL,
  `enquiry_for_name` varchar(255) DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  `status_name` varchar(100) DEFAULT NULL,
  `lead_date` datetime DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `follow_up` tinyint(1) DEFAULT '0',
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `department_name` varchar(255) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `assigned_user_name` varchar(255) DEFAULT NULL,
  `current_sale_status` int DEFAULT '0',
  `sale_won` tinyint(1) DEFAULT '0',
  `sale_won_date` datetime DEFAULT NULL,
  `sale_won_by` int DEFAULT NULL,
  `sale_lost` tinyint(1) DEFAULT '0',
  `sale_lost_date` datetime DEFAULT NULL,
  `sale_lost_by` int DEFAULT NULL,
  `loss_reason` varchar(255) DEFAULT NULL,
  `created_by_user` int DEFAULT NULL,
  `user_list` json DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_imported_leads_biz` (`business_id`),
  KEY `idx_imported_leads_contact` (`contact_id`),
  KEY `idx_imported_leads_phone` (`phone`),
  KEY `idx_imported_leads_batch` (`import_batch_id`),
  CONSTRAINT `fk_imported_leads_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_imported_leads_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imported_leads`
--

LOCK TABLES `imported_leads` WRITE;
/*!40000 ALTER TABLE `imported_leads` DISABLE KEYS */;
INSERT INTO `imported_leads` VALUES (1,1,245,'batch_1794904259880_ebgb4do','Anil Paul','918086041647','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-21 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/21/2025\", \"Assigned_To\": \"Unassigned\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anil Paul\", \"Primary_Phone\": 8086041647}','2025-10-20 18:30:00'),(2,1,246,'batch_1794904259880_ebgb4do','Christy Thomas','917012759032','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-10-23 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/23/2025\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Christy Thomas\", \"Primary_Phone\": 7012759032}','2025-10-22 18:30:00'),(3,1,247,'batch_1794904259880_ebgb4do','Mereena Sebastian','918593949792','+91',NULL,'Manickamangalam','[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-10-24 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Manickamangalam\", \"Lead_Date\": \"10/24/2025\", \"Assigned_To\": \"Hancy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Mereena Sebastian\", \"Primary_Phone\": 8593949792, \"Qualification\": \"MSW\"}','2025-10-23 18:30:00'),(4,1,248,'batch_1794904259880_ebgb4do','Arya Unni','919207455251','+91',NULL,'Okkal','[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Okkal\", \"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Arya Unni\", \"Primary_Phone\": 9207455251}','2025-10-24 18:30:00'),(5,1,249,'batch_1794904259880_ebgb4do','Anju Shaibu','919207029389','+91',NULL,'Neeleeswaram','[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Neeleeswaram\", \"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anju Shaibu\", \"Primary_Phone\": 9207029389}','2025-10-24 18:30:00'),(6,1,250,'batch_1794904259880_ebgb4do','Mathews P Cheriyan','918330029196','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Mathews P Cheriyan\", \"Primary_Phone\": 8330029196}','2025-10-24 18:30:00'),(7,1,251,'batch_1794904259880_ebgb4do','Melvin Michael','918606039481','+91',NULL,NULL,'[]','import','New Call','New Call',NULL,NULL,1,'	New Lead','2025-10-25 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"10/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Melvin Michael\", \"Primary_Phone\": 8606039481}','2025-10-24 18:30:00'),(8,1,252,'batch_1794904259880_ebgb4do','Stefin Father','918921288868','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Stefin Father\", \"Primary_Phone\": 8921288868}','2025-11-06 18:30:00'),(9,1,253,'batch_1794904259880_ebgb4do','Alisha Jose','919946627099','+91',NULL,NULL,'[]','import','New Call','New Call',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Alisha Jose\", \"Primary_Phone\": 9946627099}','2025-11-06 18:30:00'),(10,1,254,'batch_1794904259880_ebgb4do','Dona Mary Davis','916238275944','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Dona Mary Davis\", \"Primary_Phone\": 6238275944, \"Qualification\": \"12th\"}','2025-11-06 18:30:00'),(11,1,255,'batch_1794904259880_ebgb4do','Anna K Thomas','919544369627','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-11-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/7/2025\", \"Assigned_To\": \"Hancy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anna K Thomas\", \"Primary_Phone\": 9544369627, \"Qualification\": \"M.Tech Civil\"}','2025-11-06 18:30:00'),(12,1,256,'batch_1794904259880_ebgb4do','Albin Nixon','919072633714','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-11-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/10/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Albin Nixon\", \"Primary_Phone\": 9072633714}','2025-11-09 18:30:00'),(13,1,257,'batch_1794904259880_ebgb4do','Amal Krishna Pradeep','918075410272','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-11-11 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/11/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Amal Krishna Pradeep\", \"Primary_Phone\": 8075410272, \"Qualification\": \"B.Tech Mech\"}','2025-11-10 18:30:00'),(14,1,258,'batch_1794904259880_ebgb4do','Christo','919745725409','+91',NULL,NULL,'[]','import','Reference Walkin','Reference Walkin',NULL,NULL,1,'	New Lead','2025-11-18 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/18/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Christo\", \"Primary_Phone\": 9745725409}','2025-11-17 18:30:00'),(15,1,259,'batch_1794904259880_ebgb4do','Anto','917025582957','+91',NULL,NULL,'[]','import','Reference Walkin','Reference Walkin',NULL,NULL,1,'	New Lead','2025-11-18 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/18/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Anto\", \"Primary_Phone\": 7025582957}','2025-11-17 18:30:00'),(16,1,260,'batch_1794904259880_ebgb4do','Saju (Wife Soumya)','919605351939','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-11-22 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/22/2025\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Saju (Wife Soumya)\", \"Primary_Phone\": 9605351939, \"Qualification\": \"B.Ed\", \"Secondary_Phone\": 7306233611}','2025-11-21 18:30:00'),(17,1,261,'batch_1794904259880_ebgb4do','Akhila','919846398306','+91',NULL,NULL,'[]','import','New Call','New Call',NULL,NULL,1,'	New Lead','2025-11-25 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"11/25/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Akhila\", \"Primary_Phone\": 9846398306}','2025-11-24 18:30:00'),(18,1,262,'batch_1794904259880_ebgb4do','Jelin','917025787305','+91',NULL,NULL,'[]','import','New Call','New Call',NULL,NULL,1,'	New Lead','2025-12-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/1/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Jelin\", \"Primary_Phone\": 7025787305, \"Qualification\": \"MSW\"}','2025-11-30 18:30:00'),(19,1,263,'batch_1794904259880_ebgb4do','Jithin Kunjumon','917306876153','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-12-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/1/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Jithin Kunjumon\", \"Primary_Phone\": 7306876153}','2025-11-30 18:30:00'),(20,1,264,'batch_1794904259880_ebgb4do','Albin Mathew','917736804609','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-12-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/2/2025\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Albin Mathew\", \"Primary_Phone\": 7736804609, \"Qualification\": \"12th\"}','2025-12-01 18:30:00'),(21,1,265,'batch_1794904259880_ebgb4do','Avitha','917034214892','+91',NULL,'Thrissur','[]','import','New Call','New Call',NULL,NULL,1,'	New Lead','2025-12-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Thrissur\", \"Lead_Date\": \"12/4/2025\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Avitha\", \"Primary_Phone\": 7034214892, \"Qualification\": \"B.Ed / M.Sc\"}','2025-12-03 18:30:00'),(22,1,266,'batch_1794904259880_ebgb4do','Nithul Biju','919947107688','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-12-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/10/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Nithul Biju\", \"Primary_Phone\": 9947107688, \"Qualification\": \"BCA\"}','2025-12-09 18:30:00'),(23,1,267,'batch_1794904259880_ebgb4do','Aldrin Wilson','918590960749','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,1,'	New Lead','2025-12-13 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/13/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Aldrin Wilson\", \"Primary_Phone\": 8590960749}','2025-12-12 18:30:00'),(24,1,268,'batch_1794904259880_ebgb4do','Jomel P Sasi','919746802512','+91',NULL,NULL,'[]','import','Reference Walkin','Reference Walkin',NULL,NULL,1,'	New Lead','2025-12-17 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/17/2025\", \"Assigned_To\": \"Linda\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Jomel P Sasi\", \"Primary_Phone\": 9746802512, \"Qualification\": \"B.Sc HM\"}','2025-12-16 18:30:00'),(25,1,269,'batch_1794904259880_ebgb4do','Midhu','917510720372','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-12-19 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/19/2025\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Midhu\", \"Primary_Phone\": 7510720372}','2025-12-18 18:30:00'),(26,1,270,'batch_1794904259880_ebgb4do','Bibin Baby','918891301607','+91',NULL,NULL,'[]','import','New Call','New Call',NULL,NULL,1,'	New Lead','2025-12-19 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"12/19/2025\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"New Call\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Bibin Baby\", \"Primary_Phone\": 8891301607}','2025-12-18 18:30:00'),(27,1,271,'batch_1794904259880_ebgb4do','Nithin','916235054380','+91',NULL,'Chalakudy','[]','import','Call Walkin','Call Walkin',NULL,NULL,1,'	New Lead','2025-12-29 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Location\": \"Chalakudy\", \"Lead_Date\": \"12/29/2025\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"New Lead\", \"Student_Name\": \"Nithin\", \"Primary_Phone\": 6235054380, \"Qualification\": \"B.Com Finance\"}','2025-12-28 18:30:00'),(28,1,272,'batch_1794904259880_ebgb4do','Pournamy V S','919947953642','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,4,'Pending Documents','2026-01-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Waiting for documents; still asking for 3rd party arrangement for finance\", \"Lead_Date\": \"1/1/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Pournamy V S\", \"Primary_Phone\": 9947953642, \"Qualification\": \"BBA / National Aerospace\"}','2025-12-31 18:30:00'),(29,1,273,'batch_1794904259880_ebgb4do','Jithin','917559936024','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,9,'Application Submitted','2026-01-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Application submitted\", \"Lead_Date\": \"1/2/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"Application Submitted\", \"Student_Name\": \"Jithin\", \"Primary_Phone\": 7559936024, \"Qualification\": \"12th\"}','2026-01-01 18:30:00'),(30,1,274,'batch_1794904259880_ebgb4do','Alan M V','918714368015','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,2,'In Progress','2026-01-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Will come on Monday directly; shared UCOL details, waiting for documents\", \"Lead_Date\": \"1/3/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Alan M V\", \"Primary_Phone\": 8714368015, \"Qualification\": \"12th\"}','2026-01-02 18:30:00'),(31,1,275,'batch_1794904259880_ebgb4do','Veronica K','917902790819','+91',NULL,NULL,'[]','import','Instagram AD','Instagram AD',NULL,NULL,3,'Lost','2026-01-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"Application moved - waiting for offer letter; not interested\", \"Lead_Date\": \"1/4/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Instagram AD\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Veronica K\", \"Primary_Phone\": 7902790819, \"Qualification\": \"M.Sc Supply Chain\"}','2026-01-03 18:30:00'),(32,1,276,'batch_1794904259880_ebgb4do','Swetha Reji','917356100242','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,5,'No Response','2026-01-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Still no reply from candidate\", \"Lead_Date\": \"1/5/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Swetha Reji\", \"Primary_Phone\": 7356100242, \"Qualification\": \"BBA\"}','2026-01-04 18:30:00'),(33,1,277,'batch_1794904259880_ebgb4do','Kishore','918281882297','+91',NULL,NULL,'[]','import','Reference Walkin','Reference Walkin',NULL,NULL,9,'Application Submitted','2026-01-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Submitted application to NZSE Masters in Data\", \"Lead_Date\": \"1/6/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Reference Walkin\", \"Lead_Status\": \"Application Submitted\", \"Student_Name\": \"Kishore\", \"Primary_Phone\": 8281882297, \"Qualification\": \"B.Tech Engineer\"}','2026-01-05 18:30:00'),(34,1,278,'batch_1794904259880_ebgb4do','Alen Sabu','917907699924','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,11,'Application Drafted','2026-01-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Application drafted\", \"Lead_Date\": \"1/7/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"Application Drafted\", \"Student_Name\": \"Alen Sabu\", \"Primary_Phone\": 7907699924, \"Qualification\": \"GNM Nurse\"}','2026-01-06 18:30:00'),(35,1,279,'batch_1794904259880_ebgb4do','Reshmy','919946623909','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,4,'Pending Documents','2026-01-08 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Aswathy handling - waiting to receive documents\", \"Lead_Date\": \"1/8/2026\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Reshmy\", \"Primary_Phone\": 9946623909, \"Qualification\": \"GNM Nurse\", \"Secondary_Phone\": 9539030106}','2026-01-07 18:30:00'),(36,1,280,'batch_1794904259880_ebgb4do','Simil Benny','918139014854','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,2,'In Progress','2026-01-09 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested in Health Care Certificate Program Level 4\", \"Lead_Date\": \"1/9/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Simil Benny\", \"Primary_Phone\": 8139014854, \"Qualification\": \"12th\"}','2026-01-08 18:30:00'),(37,1,281,'batch_1794904259880_ebgb4do','Jeswin Shaju','916238139781','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,2,'In Progress','2026-01-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested in Health Care Certificate Program Level 5\", \"Lead_Date\": \"1/10/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Jeswin Shaju\", \"Primary_Phone\": 6238139781, \"Qualification\": \"12th\"}','2026-01-09 18:30:00'),(38,1,282,'batch_1794904259880_ebgb4do','Parvathy Poulouse','919562629824','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,2,'In Progress','2026-01-11 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"1/11/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Parvathy Poulouse\", \"Primary_Phone\": 9562629824, \"Qualification\": \"CAPS\"}','2026-01-10 18:30:00'),(39,1,283,'batch_1794904259880_ebgb4do','Ann Mariya Devassy','919207393002','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Given for conditional / declined; now given for diploma\", \"Lead_Date\": \"2/1/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Ann Mariya Devassy\", \"Primary_Phone\": 9207393002}','2026-01-31 18:30:00'),(40,1,284,'batch_1794904259880_ebgb4do','Mariya','917025652243','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Details shared MBIL & Masters in Business Intelligence; collected all documents\", \"Lead_Date\": \"2/2/2026\", \"Assigned_To\": \"Sreelakshmi\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mariya\", \"Primary_Phone\": 7025652243, \"Qualification\": \"B.Com\"}','2026-02-01 18:30:00'),(41,1,285,'batch_1794904259880_ebgb4do','Parvathy','918075421319','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,13,'Lost / Diverted','2026-02-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Looking for Germany; not that much interested in NZ\", \"Lead_Date\": \"2/3/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost / Diverted\", \"Student_Name\": \"Parvathy\", \"Primary_Phone\": 8075421319, \"Qualification\": \"GNM Nurse Sanjo\"}','2026-02-02 18:30:00'),(42,1,286,'batch_1794904259880_ebgb4do','Alex Babu','917306760857','+91',NULL,NULL,'[]','import','Call Walkin','Call Walkin',NULL,NULL,12,'Follow Up','2026-02-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"12th 2021 BioMaths 84%, B.Tech dropped, B.Com 22-25 58%, MBA 2027. NR 21-1 doubts on ITR. Will come on Saturday\", \"Lead_Date\": \"2/4/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Call Walkin\", \"Lead_Status\": \"Follow Up\", \"Student_Name\": \"Alex Babu\", \"Primary_Phone\": 7306760857, \"Qualification\": \"MBA Finance\"}','2026-02-03 18:30:00'),(43,1,287,'batch_1794904259880_ebgb4do','Jisiya','919544075107','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,8,'Decision Pending','2026-02-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Decision pending\", \"Lead_Date\": \"2/5/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Decision Pending\", \"Student_Name\": \"Jisiya\", \"Primary_Phone\": 9544075107, \"Qualification\": \"Optometry\"}','2026-02-04 18:30:00'),(44,1,288,'batch_1794904259880_ebgb4do','Athul Roy','919745824639','+91',NULL,NULL,'[]','import','Direct Walkin','Direct Walkin',NULL,NULL,5,'No Response','2026-02-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"BA LLB 2023, Safety Officer STED Council, working Doha. NR 16-2, No response 2-6, 24-6 call disconnected\", \"Lead_Date\": \"2/6/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Direct Walkin\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Athul Roy\", \"Primary_Phone\": 9745824639, \"Qualification\": \"BA LLB\"}','2026-02-05 18:30:00'),(45,1,289,'batch_1794904259880_ebgb4do','Festin Francis','918136847799','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,8,'Decision Pending','2026-02-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Decision pending; fund issue\", \"Lead_Date\": \"2/7/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Decision Pending\", \"Student_Name\": \"Festin Francis\", \"Primary_Phone\": 8136847799, \"Qualification\": \"Diploma\"}','2026-02-06 18:30:00'),(46,1,290,'batch_1794904259880_ebgb4do','Arjun Saji','917907970712','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-08 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Waiting for his update\", \"Lead_Date\": \"2/8/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Arjun Saji\", \"Primary_Phone\": 7907970712, \"Qualification\": \"B.Com\"}','2026-02-07 18:30:00'),(47,1,291,'batch_1794904259880_ebgb4do','Amal Eldhose','919656917369','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-09 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested but needs time to confirm\", \"Lead_Date\": \"2/9/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Amal Eldhose\", \"Primary_Phone\": 9656917369, \"Qualification\": \"12th\"}','2026-02-08 18:30:00'),(48,1,292,'batch_1794904259880_ebgb4do','Sujay Anil','916238921929','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,7,'Offer Received','2026-02-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Unconditional offer letter received\", \"Lead_Date\": \"2/10/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Sujay Anil\", \"Primary_Phone\": 6238921929, \"Qualification\": \"Nursing\"}','2026-02-09 18:30:00'),(49,1,293,'batch_1794904259880_ebgb4do','Antonio','919995136859','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,5,'No Response','2026-02-11 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Not responding\", \"Lead_Date\": \"2/11/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Antonio\", \"Primary_Phone\": 9995136859, \"Qualification\": \"B.Tech\"}','2026-02-10 18:30:00'),(50,1,294,'batch_1794904259880_ebgb4do','Shahin','917293043123','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,4,'Pending Documents','2026-02-12 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Shared documents, waiting for degree certificate\", \"Lead_Date\": \"2/12/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Shahin\", \"Primary_Phone\": 7293043123, \"Qualification\": \"B.Com / MBA Fin\"}','2026-02-11 18:30:00'),(51,1,295,'batch_1794904259880_ebgb4do','Adarsh','917561806345','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-13 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"2/13/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Adarsh\", \"Primary_Phone\": 7561806345, \"Qualification\": \"Commerce\"}','2026-02-12 18:30:00'),(52,1,296,'batch_1794904259880_ebgb4do','Nash A O','919207053054','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-14 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"2/14/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Nash A O\", \"Primary_Phone\": 9207053054, \"Qualification\": \"BCA\"}','2026-02-13 18:30:00'),(53,1,297,'batch_1794904259880_ebgb4do','Reebish Santhosh','919995259776','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-02-15 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Course details shared\", \"Lead_Date\": \"2/15/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Reebish Santhosh\", \"Primary_Phone\": 9995259776, \"Qualification\": \"Diploma\"}','2026-02-14 18:30:00'),(54,1,298,'batch_1794904259880_ebgb4do','Aparna Alias','918590470630','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,7,'Offer Received','2026-02-16 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Received offer from NZSE\", \"Lead_Date\": \"2/16/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Aparna Alias\", \"Primary_Phone\": 8590470630, \"Qualification\": \"Hospital Admin\"}','2026-02-15 18:30:00'),(55,1,299,'batch_1794904259880_ebgb4do','Nibin John','918089634476','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,7,'Offer Received','2026-03-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Received offer from SIT; still interested in NZSE Addiction Diploma (2 offers received)\", \"Lead_Date\": \"3/1/2026\", \"Assigned_To\": \"Aswathy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Nibin John\", \"Primary_Phone\": 8089634476}','2026-02-28 18:30:00'),(56,1,300,'batch_1794904259880_ebgb4do','Nakul Gopinath','918848528025','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-03-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Offer letter waiting\", \"Lead_Date\": \"3/2/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Nakul Gopinath\", \"Primary_Phone\": 8848528025}','2026-03-01 18:30:00'),(57,1,301,'batch_1794904259880_ebgb4do','Eldho George','919496336332','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,3,'Lost','2026-03-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"Back out case - age limit\", \"Lead_Date\": \"3/3/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Eldho George\", \"Primary_Phone\": 9496336332}','2026-03-02 18:30:00'),(58,1,302,'batch_1794904259880_ebgb4do','Josiya','918157085147','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,10,'Visa Stage','2026-03-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Offer letter received; waiting for visa submission\", \"Lead_Date\": \"3/4/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Visa Stage\", \"Student_Name\": \"Josiya\", \"Primary_Phone\": 8157085147}','2026-03-03 18:30:00'),(59,1,303,'batch_1794904259880_ebgb4do','Neena Mathew','918111938061','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-03-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Interested in MBIL and NZSE; shared details\", \"Lead_Date\": \"3/5/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Neena Mathew\", \"Primary_Phone\": 8111938061}','2026-03-04 18:30:00'),(60,1,304,'batch_1794904259880_ebgb4do','Dhiya Rose','917356749374','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-03-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"3/6/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Dhiya Rose\", \"Primary_Phone\": 7356749374}','2026-03-05 18:30:00'),(61,1,305,'batch_1794904259880_ebgb4do','Sherine Shaju','917736097450','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,3,'Lost','2026-04-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"No response 24-6. 12th 2026 78%, going for IELTS; moved UK with other agency\", \"Lead_Date\": \"4/1/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Sherine Shaju\", \"Primary_Phone\": 7736097450, \"Qualification\": \"12th\"}','2026-03-31 18:30:00'),(62,1,306,'batch_1794904259880_ebgb4do','Renjith T.A','917994242294','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-04-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/2/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Renjith T.A\", \"Primary_Phone\": 7994242294}','2026-04-01 18:30:00'),(63,1,307,'batch_1794904259880_ebgb4do','Charles George','916235928027','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-04-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/3/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Charles George\", \"Primary_Phone\": 6235928027}','2026-04-02 18:30:00'),(64,1,308,'batch_1794904259880_ebgb4do','John Peter','918921319217','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-04-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/4/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"John Peter\", \"Primary_Phone\": 8921319217}','2026-04-03 18:30:00'),(65,1,309,'batch_1794904259880_ebgb4do','Akash','918985964850','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-04-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/5/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Akash\", \"Primary_Phone\": 8985964850}','2026-04-04 18:30:00'),(66,1,310,'batch_1794904259880_ebgb4do','Silpa','918921588848','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-04-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"4/6/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Silpa\", \"Primary_Phone\": 8921588848}','2026-04-05 18:30:00'),(67,1,311,'batch_1794904259880_ebgb4do','Maria Rose Joy','916238199308','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,3,'Lost','2026-05-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"Moved Australia through other agency\", \"Lead_Date\": \"5/1/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Maria Rose Joy\", \"Primary_Phone\": 6238199308}','2026-04-30 18:30:00'),(68,1,312,'batch_1794904259880_ebgb4do','Sujil Mathew','919495539298','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,3,'Lost','2026-05-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"Course options shared, not interested\", \"Lead_Date\": \"5/2/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Sujil Mathew\", \"Primary_Phone\": 9495539298}','2026-05-01 18:30:00'),(69,1,313,'batch_1794904259880_ebgb4do','Sanju Sabu','919946613952','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,3,'Lost','2026-05-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"Not proceeding to abroad education\", \"Lead_Date\": \"5/3/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Sanju Sabu\", \"Primary_Phone\": 9946613952}','2026-05-02 18:30:00'),(70,1,314,'batch_1794904259880_ebgb4do','Jerin Joy','917306072036','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,5,'No Response','2026-05-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"No response to call\", \"Lead_Date\": \"5/4/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"No Response\", \"Student_Name\": \"Jerin Joy\", \"Primary_Phone\": 7306072036}','2026-05-03 18:30:00'),(71,1,315,'batch_1794904259880_ebgb4do','Dini K Davis','919947343239','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,3,'Lost','2026-05-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',2,0,NULL,NULL,1,'2026-11-17 14:01:00',502,NULL,70,'[502]','{\"Remarks\": \"Not proceeding to abroad education\", \"Lead_Date\": \"5/5/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Lost\", \"Student_Name\": \"Dini K Davis\", \"Primary_Phone\": 9947343239}','2026-05-04 18:30:00'),(72,1,316,'batch_1794904259880_ebgb4do','Emmanuel Xavier','919188105919','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,6,'	Proceeding','2026-05-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/6/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Emmanuel Xavier\", \"Primary_Phone\": 9188105919}','2026-05-05 18:30:00'),(73,1,317,'batch_1794904259880_ebgb4do','Anette Joy','918848922735','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,6,'	Proceeding','2026-05-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/7/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Anette Joy\", \"Primary_Phone\": 8848922735}','2026-05-06 18:30:00'),(74,1,318,'batch_1794904259880_ebgb4do','Christal Biju','918606074191','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,6,'	Proceeding','2026-05-08 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/8/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Christal Biju\", \"Primary_Phone\": 8606074191}','2026-05-07 18:30:00'),(75,1,319,'batch_1794904259880_ebgb4do','Tom Sebastian','917594914948','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,8,'Decision Pending','2026-05-09 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Decision pending\", \"Lead_Date\": \"5/9/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Decision Pending\", \"Student_Name\": \"Tom Sebastian\", \"Primary_Phone\": 7594914948}','2026-05-08 18:30:00'),(76,1,320,'batch_1794904259880_ebgb4do','Athul Pramond','918089994154','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,6,'	Proceeding','2026-05-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Proceeding\", \"Lead_Date\": \"5/10/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Proceeding\", \"Student_Name\": \"Athul Pramond\", \"Primary_Phone\": 8089994154}','2026-05-09 18:30:00'),(77,1,321,'batch_1794904259880_ebgb4do','Mohammed Shanif','917561034827','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-11 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/11/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mohammed Shanif\", \"Primary_Phone\": 7561034827}','2026-05-10 18:30:00'),(78,1,322,'batch_1794904259880_ebgb4do','Alen Mathew Paul','918129195563','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-12 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/12/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Alen Mathew Paul\", \"Primary_Phone\": 8129195563}','2026-05-11 18:30:00'),(79,1,323,'batch_1794904259880_ebgb4do','Anjana Suku','919995117694','+91',NULL,'Georgia','[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-13 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Country interest: Georgia\", \"Location\": \"Georgia\", \"Lead_Date\": \"5/13/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Anjana Suku\", \"Primary_Phone\": 9995117694}','2026-05-12 18:30:00'),(80,1,324,'batch_1794904259880_ebgb4do','Devika PV','917736241897','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-14 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/14/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Devika PV\", \"Primary_Phone\": 7736241897}','2026-05-13 18:30:00'),(81,1,325,'batch_1794904259880_ebgb4do','Ananthu MK','918075531696','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-15 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/15/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Ananthu MK\", \"Primary_Phone\": 8075531696}','2026-05-14 18:30:00'),(82,1,326,'batch_1794904259880_ebgb4do','Mebin Benny','917510151304','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-16 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/16/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mebin Benny\", \"Primary_Phone\": 7510151304}','2026-05-15 18:30:00'),(83,1,327,'batch_1794904259880_ebgb4do','Sanjay Krishna','919486711487','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-05-17 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"5/17/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sanjay Krishna\", \"Primary_Phone\": 9486711487, \"Secondary_Phone\": 9486668807}','2026-05-16 18:30:00'),(84,1,328,'batch_1794904259880_ebgb4do','Jezebel Merlin','919995366699','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/1/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Jezebel Merlin\", \"Primary_Phone\": 9995366699}','2026-05-31 18:30:00'),(85,1,329,'batch_1794904259880_ebgb4do','Grace Helen','916235681421','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/2/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Grace Helen\", \"Primary_Phone\": 6235681421}','2026-06-01 18:30:00'),(86,1,330,'batch_1794904259880_ebgb4do','Dinu Denny','916282373018','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/3/2026\", \"Assigned_To\": \"Sreelakshmi\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Dinu Denny\", \"Primary_Phone\": 6282373018}','2026-06-02 18:30:00'),(87,1,331,'batch_1794904259880_ebgb4do','Mariya Sony','919744467561','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,10,'Visa Stage','2026-06-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Visa proceeding; contacted by Josmi - NZSE\", \"Lead_Date\": \"6/4/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Visa Stage\", \"Student_Name\": \"Mariya Sony\", \"Primary_Phone\": 9744467561}','2026-06-03 18:30:00'),(88,1,332,'batch_1794904259880_ebgb4do','Aleena Biju','917025486201','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/5/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Aleena Biju\", \"Primary_Phone\": 7025486201}','2026-06-04 18:30:00'),(89,1,333,'batch_1794904259880_ebgb4do','Benjammin Benny','917306480425','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/6/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Benjammin Benny\", \"Primary_Phone\": 7306480425}','2026-06-05 18:30:00'),(90,1,334,'batch_1794904259880_ebgb4do','Prince Cleetus','916238719423','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/7/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Prince Cleetus\", \"Primary_Phone\": 6238719423}','2026-06-06 18:30:00'),(91,1,335,'batch_1794904259880_ebgb4do','Heaven Christo','919567715403','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-06-08 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"6/8/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Heaven Christo\", \"Primary_Phone\": 9567715403}','2026-06-07 18:30:00'),(92,1,336,'batch_1794904259880_ebgb4do','Darsana C.S','919562941995','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/1/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Darsana C.S\", \"Primary_Phone\": 9562941995}','2026-06-30 18:30:00'),(93,1,337,'batch_1794904259880_ebgb4do','Andriya Baby','918848918012','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/2/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Andriya Baby\", \"Primary_Phone\": 8848918012}','2026-07-01 18:30:00'),(94,1,338,'batch_1794904259880_ebgb4do','Denil K Thoman','919447015393','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/4/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Denil K Thoman\", \"Primary_Phone\": 9447015393}','2026-07-03 18:30:00'),(95,1,339,'batch_1794904259880_ebgb4do','Ananya Shijo','919142131108','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/5/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Ananya Shijo\", \"Primary_Phone\": 9142131108}','2026-07-04 18:30:00'),(96,1,340,'batch_1794904259880_ebgb4do','John Saju','918590499317','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/6/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"John Saju\", \"Primary_Phone\": 8590499317}','2026-07-05 18:30:00'),(97,1,341,'batch_1794904259880_ebgb4do','Gaius Rajan','919447362491','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/7/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Gaius Rajan\", \"Primary_Phone\": 9447362491}','2026-07-06 18:30:00'),(98,1,342,'batch_1794904259880_ebgb4do','Wilston P Wilson','917736412437','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-08 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/8/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Wilston P Wilson\", \"Primary_Phone\": 7736412437}','2026-07-07 18:30:00'),(99,1,343,'batch_1794904259880_ebgb4do','Niya Tomy','918547736939','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-09 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/9/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Niya Tomy\", \"Primary_Phone\": 8547736939}','2026-07-08 18:30:00'),(100,1,344,'batch_1794904259880_ebgb4do','Sial P Raju','919961108841','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/10/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sial P Raju\", \"Primary_Phone\": 9961108841}','2026-07-09 18:30:00'),(101,1,345,'batch_1794904259880_ebgb4do','Sanoop Babu','917306028646','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-11 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/11/2026\", \"Assigned_To\": \"Bessy\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sanoop Babu\", \"Primary_Phone\": 7306028646}','2026-07-10 18:30:00'),(102,1,346,'batch_1794904259880_ebgb4do','Jerin Joy','919633270255','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-07-12 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"7/12/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Jerin Joy\", \"Primary_Phone\": 9633270255}','2026-07-11 18:30:00'),(103,1,347,'batch_1794904259880_ebgb4do','Dhanya Louis','919946980757','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,4,'Pending Documents','2026-09-01 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Documents not received\", \"Lead_Date\": \"9/1/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Pending Documents\", \"Student_Name\": \"Dhanya Louis\", \"Primary_Phone\": 9946980757}','2026-08-31 18:30:00'),(104,1,348,'batch_1794904259880_ebgb4do','Aswin Shaji','916282704096','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,7,'Offer Received','2026-09-02 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',1,1,'2026-11-17 14:01:00',502,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Offer received\", \"Lead_Date\": \"9/2/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"Offer Received\", \"Student_Name\": \"Aswin Shaji\", \"Primary_Phone\": 6282704096}','2026-09-01 18:30:00'),(105,1,349,'batch_1794904259880_ebgb4do','Rose Mary Benny','916235768247','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-03 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/3/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Rose Mary Benny\", \"Primary_Phone\": 6235768247}','2026-09-02 18:30:00'),(106,1,350,'batch_1794904259880_ebgb4do','Sneha Mary Varghese','917028713469','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-04 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/4/2026\", \"Assigned_To\": \"Roshan\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Sneha Mary Varghese\", \"Primary_Phone\": 7028713469}','2026-09-03 18:30:00'),(107,1,351,'batch_1794904259880_ebgb4do','Libin Joseph','918281065205','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-05 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/5/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Libin Joseph\", \"Primary_Phone\": 8281065205}','2026-09-04 18:30:00'),(108,1,352,'batch_1794904259880_ebgb4do','Abhiesk A','919633785881','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-06 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/6/2026\", \"Assigned_To\": \"Anitha\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Abhiesk A\", \"Primary_Phone\": 9633785881}','2026-09-05 18:30:00'),(109,1,353,'batch_1794904259880_ebgb4do','Kavya Murali','918590337710','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-07 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/7/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Kavya Murali\", \"Primary_Phone\": 8590337710}','2026-09-06 18:30:00'),(110,1,354,'batch_1794904259880_ebgb4do','Tinu Yohannan','918606019562','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-08 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/8/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Tinu Yohannan\", \"Primary_Phone\": 8606019562}','2026-09-07 18:30:00'),(111,1,355,'batch_1794904259880_ebgb4do','Namrutha P','919544758662','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-09 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/9/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Namrutha P\", \"Primary_Phone\": 9544758662}','2026-09-08 18:30:00'),(112,1,356,'batch_1794904259880_ebgb4do','Mary Anjana Antony','919061660862','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-10 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/10/2026\", \"Assigned_To\": \"Shalna\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Mary Anjana Antony\", \"Primary_Phone\": 9061660862}','2026-09-09 18:30:00'),(113,1,357,'batch_1794904259880_ebgb4do','Akshay Rajendran','919207926995','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-11 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/11/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Akshay Rajendran\", \"Primary_Phone\": 9207926995}','2026-09-10 18:30:00'),(114,1,358,'batch_1794904259880_ebgb4do','Dibin Biju','919846079560','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-12 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/12/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Dibin Biju\", \"Primary_Phone\": 9846079560}','2026-09-11 18:30:00'),(115,1,359,'batch_1794904259880_ebgb4do','Denil Joy','918304010349','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-13 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/13/2026\", \"Assigned_To\": \"Irin\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Denil Joy\", \"Primary_Phone\": 8304010349}','2026-09-12 18:30:00'),(116,1,360,'batch_1794904259880_ebgb4do','Aparna V','919061433009','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-14 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/14/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Aparna V\", \"Primary_Phone\": 9061433009}','2026-09-13 18:30:00'),(117,1,361,'batch_1794904259880_ebgb4do','Melissa Jaiby','916363689904','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-15 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/15/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Melissa Jaiby\", \"Primary_Phone\": 6363689904}','2026-09-14 18:30:00'),(118,1,362,'batch_1794904259880_ebgb4do','Balamuralikrishna','919746380879','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-16 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/16/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Balamuralikrishna\", \"Primary_Phone\": 9746380879}','2026-09-15 18:30:00'),(119,1,363,'batch_1794904259880_ebgb4do','Nandana Surendran','918086836374','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-17 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/17/2026\", \"Assigned_To\": \"Roshni\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Nandana Surendran\", \"Primary_Phone\": 8086836374}','2026-09-16 18:30:00'),(120,1,364,'batch_1794904259880_ebgb4do','Albin Reji','919995154072','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-18 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Country interest: Germany\", \"Lead_Date\": \"9/18/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Albin Reji\", \"Primary_Phone\": 9995154072}','2026-09-17 18:30:00'),(121,1,365,'batch_1794904259880_ebgb4do','Abhijith Siju','918943391979','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-19 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Remarks\": \"Country interest: Germany\", \"Lead_Date\": \"9/19/2026\", \"Assigned_To\": \"Linson\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Abhijith Siju\", \"Primary_Phone\": 8943391979}','2026-09-18 18:30:00'),(122,1,366,'batch_1794904259880_ebgb4do','Anas','918592873809','+91',NULL,NULL,'[]','import','Unknown','Unknown',NULL,NULL,2,'In Progress','2026-09-20 00:00:00','2026-11-17',1,1,'ufs',1,'test',502,'Priya Sharma',0,0,NULL,NULL,0,NULL,NULL,NULL,70,'[502]','{\"Lead_Date\": \"9/20/2026\", \"Assigned_To\": \"Sandra\", \"Lead_Source\": \"Unknown\", \"Lead_Status\": \"In Progress\", \"Student_Name\": \"Anas\", \"Primary_Phone\": 8592873809}','2026-09-19 18:30:00');
/*!40000 ALTER TABLE `imported_leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intakes`
--

DROP TABLE IF EXISTS `intakes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intakes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `intakes_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intakes`
--

LOCK TABLES `intakes` WRITE;
/*!40000 ALTER TABLE `intakes` DISABLE KEYS */;
/*!40000 ALTER TABLE `intakes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integrations`
--

DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `type` enum('zoho','hubspot','woocommerce','shopify','zapier','pabbly','google_sheets','google_calendar','openai','razorpay','stripe','payu') DEFAULT NULL,
  `config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `connected_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `integrations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integrations`
--

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_call_logs`
--

DROP TABLE IF EXISTS `ivr_call_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_call_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `flow_id` int DEFAULT NULL,
  `caller_number` varchar(20) DEFAULT NULL,
  `key_pressed` varchar(5) DEFAULT NULL,
  `call_duration` int DEFAULT NULL,
  `status` enum('answered','missed','forwarded') DEFAULT NULL,
  `called_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `flow_id` (`flow_id`),
  CONSTRAINT `ivr_call_logs_ibfk_1` FOREIGN KEY (`flow_id`) REFERENCES `ivr_flows` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_call_logs`
--

LOCK TABLES `ivr_call_logs` WRITE;
/*!40000 ALTER TABLE `ivr_call_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_call_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_flows`
--

DROP TABLE IF EXISTS `ivr_flows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_flows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `did_number` varchar(20) DEFAULT NULL,
  `welcome_audio_url` varchar(500) DEFAULT NULL,
  `menu` json DEFAULT NULL,
  `fallback_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `ivr_flows_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_flows`
--

LOCK TABLES `ivr_flows` WRITE;
/*!40000 ALTER TABLE `ivr_flows` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_flows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_emails`
--

DROP TABLE IF EXISTS `lead_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_emails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `contact_id` int DEFAULT NULL,
  `campaign_id` varchar(50) DEFAULT NULL,
  `brevo_message_id` varchar(255) DEFAULT NULL,
  `sender_email` varchar(255) DEFAULT NULL,
  `to_email` varchar(255) NOT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `content` longtext,
  `status` varchar(30) NOT NULL DEFAULT 'sent',
  `bounce_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT NULL,
  `last_event` varchar(50) DEFAULT NULL,
  `last_event_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_contact` (`contact_id`),
  KEY `idx_msg` (`brevo_message_id`),
  KEY `idx_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_emails`
--

LOCK TABLES `lead_emails` WRITE;
/*!40000 ALTER TABLE `lead_emails` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_fields`
--

DROP TABLE IF EXISTS `lead_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `label` varchar(120) NOT NULL,
  `field_key` varchar(80) NOT NULL,
  `field_type` enum('text','number','dropdown','date','dob','email','phone','textarea') NOT NULL DEFAULT 'text',
  `options` json DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_biz_key` (`business_id`,`field_key`),
  KEY `fk_lf_field_category` (`category_id`),
  CONSTRAINT `fk_lf_field_category` FOREIGN KEY (`category_id`) REFERENCES `field_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lead_fields_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_fields`
--

LOCK TABLES `lead_fields` WRITE;
/*!40000 ALTER TABLE `lead_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_statuses`
--

DROP TABLE IF EXISTS `lead_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `is_followup` tinyint(1) DEFAULT '0',
  `is_transfer` tinyint(1) DEFAULT '0',
  `transfer_department_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `transfer_department_id` (`transfer_department_id`),
  CONSTRAINT `lead_statuses_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `lead_statuses_ibfk_2` FOREIGN KEY (`transfer_department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_statuses`
--

LOCK TABLES `lead_statuses` WRITE;
/*!40000 ALTER TABLE `lead_statuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `enquiry_for_id` int DEFAULT NULL,
  `status` varchar(100) DEFAULT 'New',
  `loss_reason` varchar(255) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  KEY `enquiry_for_id` (`enquiry_for_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leads_ibfk_3` FOREIGN KEY (`enquiry_for_id`) REFERENCES `enquiry_fors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leads_ibfk_4` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int DEFAULT NULL,
  `direction` enum('inbound','outbound') DEFAULT NULL,
  `content` text,
  `media_url` varchar(500) DEFAULT NULL,
  `message_type` enum('text','image','video','document','template','interactive','location','audio','voice','sticker') DEFAULT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'sent',
  `wa_message_id` varchar(100) DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reference_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_business_id` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opt_in_links`
--

DROP TABLE IF EXISTS `opt_in_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opt_in_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `token` varchar(100) DEFAULT NULL,
  `redirect_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `opt_in_links_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opt_in_links`
--

LOCK TABLES `opt_in_links` WRITE;
/*!40000 ALTER TABLE `opt_in_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `opt_in_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int DEFAULT NULL,
  `conversation_id` int DEFAULT NULL,
  `items` json DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_gateway` enum('razorpay','stripe','payu') DEFAULT NULL,
  `payment_id` varchar(200) DEFAULT NULL,
  `shipping_address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `probabilities`
--

DROP TABLE IF EXISTS `probabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `probabilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '#64748b',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `probabilities_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `probabilities`
--

LOCK TABLES `probabilities` WRITE;
/*!40000 ALTER TABLE `probabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `probabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rcs_campaigns`
--

DROP TABLE IF EXISTS `rcs_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rcs_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sender_id` varchar(100) DEFAULT NULL,
  `content` json DEFAULT NULL,
  `target_tags` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `rcs_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_campaigns`
--

LOCK TABLES `rcs_campaigns` WRITE;
/*!40000 ALTER TABLE `rcs_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `rcs_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rcs_templates`
--

DROP TABLE IF EXISTS `rcs_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rcs_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `card_type` enum('text','rich_card','carousel','quick_reply') DEFAULT NULL,
  `content` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `rcs_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rcs_templates`
--

LOCK TABLES `rcs_templates` WRITE;
/*!40000 ALTER TABLE `rcs_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `rcs_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt_types`
--

DROP TABLE IF EXISTS `receipt_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `receipt_types_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_types`
--

LOCK TABLES `receipt_types` WRITE;
/*!40000 ALTER TABLE `receipt_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipt_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `receipt_type_id` int DEFAULT NULL,
  `receipt_type_name` varchar(255) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `receipt_date` date NOT NULL,
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `receipt_type_id` (`receipt_type_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `receipts_ibfk_3` FOREIGN KEY (`receipt_type_id`) REFERENCES `receipt_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `receipts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shared_media_library`
--

DROP TABLE IF EXISTS `shared_media_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shared_media_library` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_type` enum('image','video','document','audio') DEFAULT 'document',
  `file_size` int DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `shared_media_library_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shared_media_library_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shared_media_library`
--

LOCK TABLES `shared_media_library` WRITE;
/*!40000 ALTER TABLE `shared_media_library` DISABLE KEYS */;
/*!40000 ALTER TABLE `shared_media_library` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_campaigns`
--

DROP TABLE IF EXISTS `sms_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sender_id` varchar(20) DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `message` text,
  `target_tags` json DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','scheduled','running','completed','failed') DEFAULT 'draft',
  `total_sent` int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_failed` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `sms_campaigns_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_campaigns`
--

LOCK TABLES `sms_campaigns` WRITE;
/*!40000 ALTER TABLE `sms_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_dlt_templates`
--

DROP TABLE IF EXISTS `sms_dlt_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_dlt_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `dlt_template_id` varchar(100) DEFAULT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `message` text,
  `type` enum('transactional','promotional','otp') DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `sms_dlt_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_dlt_templates`
--

LOCK TABLES `sms_dlt_templates` WRITE;
/*!40000 ALTER TABLE `sms_dlt_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_dlt_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_accounts`
--

DROP TABLE IF EXISTS `social_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `platform` enum('whatsapp','facebook','instagram') NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `phone_id` varchar(100) DEFAULT NULL,
  `account_id` varchar(100) DEFAULT NULL,
  `token` text NOT NULL,
  `verify_token` varchar(100) DEFAULT NULL,
  `waba_id` varchar(100) DEFAULT NULL,
  `app_id` varchar(100) DEFAULT NULL,
  `app_secret` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `source_category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_sa_source_category` (`source_category_id`),
  CONSTRAINT `fk_sa_source_category` FOREIGN KEY (`source_category_id`) REFERENCES `source_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `social_accounts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_accounts`
--

LOCK TABLES `social_accounts` WRITE;
/*!40000 ALTER TABLE `social_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `source_categories`
--

DROP TABLE IF EXISTS `source_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `source_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `source_categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `source_categories`
--

LOCK TABLES `source_categories` WRITE;
/*!40000 ALTER TABLE `source_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `source_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `follow_needed` enum('Yes','No','Won','Loss') DEFAULT 'Yes',
  `color` varchar(20) DEFAULT '#000000',
  `sequence` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `transfer` tinyint(1) DEFAULT '0',
  `department_id` int DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (1,'	New Lead','Yes','#4F46E5',0,'2026-11-17 07:16:01','2026-11-17 07:16:01',0,NULL,NULL),(2,'In Progress','Yes','#4F46E5',0,'2026-11-17 07:16:09','2026-11-17 07:16:09',0,NULL,NULL),(3,'Lost','Yes','#4F46E5',0,'2026-11-17 07:16:18','2026-11-17 07:16:22',1,NULL,'sale_lost'),(4,'Pending Documents','Yes','#4F46E5',0,'2026-11-17 07:16:30','2026-11-17 07:16:30',1,NULL,NULL),(5,'No Response','Yes','#4F46E5',0,'2026-11-17 07:16:36','2026-11-17 07:16:36',0,NULL,NULL),(6,'	Proceeding','Yes','#4F46E5',0,'2026-11-17 07:16:43','2026-11-17 07:16:43',0,NULL,NULL),(7,'Offer Received','Yes','#4F46E5',0,'2026-11-17 07:16:52','2026-11-17 07:16:52',1,NULL,'sale'),(8,'Decision Pending','Yes','#4F46E5',0,'2026-11-17 07:16:59','2026-11-17 07:16:59',1,NULL,NULL),(9,'Application Submitted','Yes','#4F46E5',0,'2026-11-17 07:17:24','2026-11-17 07:17:24',1,NULL,'sale'),(10,'Visa Stage','Yes','#4F46E5',0,'2026-11-17 07:17:33','2026-11-17 07:17:33',1,NULL,NULL),(11,'Application Drafted','Yes','#4F46E5',0,'2026-11-17 07:17:42','2026-11-17 07:17:42',0,NULL,NULL),(12,'Follow Up','Yes','#4F46E5',0,'2026-11-17 07:17:50','2026-11-17 07:17:50',1,NULL,NULL),(13,'Lost / Diverted','Yes','#4F46E5',0,'2026-11-17 07:17:58','2026-11-17 07:17:58',1,NULL,NULL),(14,'Coaching','Yes','#4F46E5',0,'2026-11-17 07:18:05','2026-11-17 07:18:05',0,NULL,NULL);
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `team_id` int NOT NULL,
  `user_id` int NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_user` (`team_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES (4,2,131,'2026-11-17 09:06:02'),(5,2,502,'2026-11-17 09:06:02'),(6,2,132,'2026-11-17 09:06:02'),(7,3,132,'2026-11-17 09:06:05'),(8,3,502,'2026-11-17 09:06:05'),(9,3,131,'2026-11-17 09:06:05'),(12,5,502,'2026-11-17 10:05:30'),(13,5,131,'2026-11-17 10:05:30'),(14,5,132,'2026-11-17 10:05:30');
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `user_id` int NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `fk_teams_user_id` (`user_id`),
  CONSTRAINT `fk_teams_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (2,1,131,NULL,'2026-11-17 09:06:02'),(3,1,132,NULL,'2026-11-17 09:06:05'),(5,1,502,NULL,'2026-11-17 10:05:30');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` enum('MARKETING','UTILITY','AUTHENTICATION') DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `header_type` enum('none','text','image','video','document') DEFAULT 'none',
  `header_content` text,
  `body` text,
  `footer` text,
  `buttons` json DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `wa_template_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `universities`
--

DROP TABLE IF EXISTS `universities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `universities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'New Zealand',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universities`
--

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
/*!40000 ALTER TABLE `universities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_document_upload`
--

DROP TABLE IF EXISTS `user_document_upload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_document_upload` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `notes` text,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `user_document_upload_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_document_upload_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_document_upload_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_document_upload`
--

LOCK TABLES `user_document_upload` WRITE;
/*!40000 ALTER TABLE `user_document_upload` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_document_upload` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('superadmin','admin','manager','agent') DEFAULT 'agent',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(255) DEFAULT NULL,
  `agent_status` enum('active','inactive') DEFAULT 'active',
  `designation_id` int DEFAULT NULL,
  `employee_code` varchar(100) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `permissions` text,
  `allowed_custom_field_categories` json DEFAULT NULL,
  `is_dev` tinyint(1) NOT NULL DEFAULT '0',
  `company_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `unique_user_phone` (`phone`),
  KEY `business_id` (`business_id`),
  KEY `fk_users_branch` (`branch_id`),
  KEY `fk_users_department` (`department_id`),
  KEY `idx_users_email` (`email`),
  CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=503 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (70,1,NULL,NULL,'Administrator','admin@trackbox.com','8086086817','$2b$10$YLMl/gnBCALernNeRSly0OVKF3moUzJIz0xG9K0Q.mMfPLzK1t1pm','admin',1,'2026-11-11 07:08:03','admin','active',NULL,NULL,NULL,NULL,'[]',0,NULL),(71,1,NULL,NULL,'UFS Developer','ufs@trackbox.com',NULL,'$2b$10$YLMl/gnBCALernNeRSly0OVKF3moUzJIz0xG9K0Q.mMfPLzK1t1pm','superadmin',1,'2026-11-11 07:08:03','ufs','active',NULL,NULL,NULL,NULL,NULL,1,NULL),(131,1,1,1,'Rahul Menon','rahul.menon@trackboxcrm.com','8129025108',NULL,'agent',1,'2026-11-11 07:50:21','rahul_uk','active',121,'UK-01',NULL,NULL,'[]',0,NULL),(132,1,1,1,'Deepa Nair','deepa.nair@trackboxcrm.com','7907052130','$2b$10$FSy1q0DNQHMdw.zInrZLY./JZ0YcyoPHXCzBV4Yd9IAT3VysOJH5G','agent',1,'2026-11-11 07:50:21','deepa_uk','active',122,'UK-02',NULL,NULL,'[]',0,NULL),(502,1,1,1,'Priya Sharma','priya.sharma@trackboxcrm.com','9544554942','$2b$10$5htDc77pkIF3BMi7HNlO6..uotUoQVZjxoDDhZZ4890W1/zGmqn/6','manager',1,'2026-11-11 07:49:27','priya','active',402,'EMP-CAN-02','2024-09-01','[{\"menuName\":\"Dashboard\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"CRM\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Tasks\",\"view\":true,\"save\":true,\"edit\":true,\"delete\":true},{\"menuName\":\"Reports\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Email\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Settings\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Teams\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Branch\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Department\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Designation\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Universities\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Courses\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Application Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Intake\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Year\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Status\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Enquiry For\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Lead Fields\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Field Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Document Type\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channels Manager\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Channel\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Source Categories\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"API & Webhooks\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false},{\"menuName\":\"Integrations\",\"view\":false,\"save\":false,\"edit\":false,\"delete\":false}]','[]',0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visa_history`
--

DROP TABLE IF EXISTS `visa_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visa_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `visa_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `status` enum('Submitted','Approved') NOT NULL,
  `details` text,
  `visa_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `visa_id` (`visa_id`),
  KEY `contact_id` (`contact_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `visa_history_ibfk_1` FOREIGN KEY (`visa_id`) REFERENCES `visas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_history_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visa_history_ibfk_3` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visa_history`
--

LOCK TABLES `visa_history` WRITE;
/*!40000 ALTER TABLE `visa_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `visa_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visas`
--

DROP TABLE IF EXISTS `visas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contact_id` int NOT NULL,
  `business_id` int NOT NULL,
  `status` enum('Submitted','Approved') NOT NULL DEFAULT 'Submitted',
  `visa_date` date DEFAULT NULL,
  `description` text,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `contact_id` (`contact_id`),
  KEY `business_id` (`business_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `visas_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visas_ibfk_2` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visas_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visas`
--

LOCK TABLES `visas` WRITE;
/*!40000 ALTER TABLE `visas` DISABLE KEYS */;
/*!40000 ALTER TABLE `visas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_widgets`
--

DROP TABLE IF EXISTS `website_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_widgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `chatbot_id` int DEFAULT NULL,
  `widget_name` varchar(255) DEFAULT NULL,
  `welcome_message` text,
  `brand_color` varchar(7) DEFAULT '#25D366',
  `position` enum('bottom-right','bottom-left') DEFAULT 'bottom-right',
  `allowed_domains` text,
  `widget_token` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widget_token` (`widget_token`),
  KEY `business_id` (`business_id`),
  KEY `chatbot_id` (`chatbot_id`),
  CONSTRAINT `website_widgets_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`),
  CONSTRAINT `website_widgets_ibfk_2` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbots` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_widgets`
--

LOCK TABLES `website_widgets` WRITE;
/*!40000 ALTER TABLE `website_widgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `website_widgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_messages`
--

DROP TABLE IF EXISTS `whatsapp_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `contact_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `direction` enum('inbound','outbound') NOT NULL DEFAULT 'inbound',
  `wa_message_id` varchar(150) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('sent','delivered','read','failed') DEFAULT 'delivered',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_business_id` (`business_id`),
  KEY `idx_wa_message_id` (`wa_message_id`),
  CONSTRAINT `fk_whatsapp_messages_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_whatsapp_messages_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_whatsapp_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_messages`
--

LOCK TABLES `whatsapp_messages` WRITE;
/*!40000 ALTER TABLE `whatsapp_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_qr_sessions`
--

DROP TABLE IF EXISTS `whatsapp_qr_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_qr_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL,
  `user_id` int DEFAULT NULL,
  `business_id` int DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `creds_json` longtext,
  `status` enum('pending','connected','disconnected') DEFAULT 'pending',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`),
  UNIQUE KEY `uq_wqr_user_id` (`user_id`),
  KEY `idx_wqr_phone` (`phone_number`),
  KEY `idx_wqr_user` (`user_id`),
  CONSTRAINT `whatsapp_qr_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_qr_sessions`
--

LOCK TABLES `whatsapp_qr_sessions` WRITE;
/*!40000 ALTER TABLE `whatsapp_qr_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_qr_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `years`
--

DROP TABLE IF EXISTS `years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `business_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `years`
--

LOCK TABLES `years` WRITE;
/*!40000 ALTER TABLE `years` DISABLE KEYS */;
/*!40000 ALTER TABLE `years` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-17 16:57:06
