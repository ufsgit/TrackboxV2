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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_history`
--

LOCK TABLES `application_history` WRITE;
/*!40000 ALTER TABLE `application_history` DISABLE KEYS */;
INSERT INTO `application_history` VALUES (5,2,132,'Application Created','Initial application created.','2026-11-13 08:11:42');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_status_change`
--

LOCK TABLES `application_status_change` WRITE;
/*!40000 ALTER TABLE `application_status_change` DISABLE KEYS */;
INSERT INTO `application_status_change` VALUES (5,2,'2026-11-13 13:41:42',NULL,NULL,4,'enrolled',132,'2026-11-13 08:11:42');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_statuses`
--

LOCK TABLES `application_statuses` WRITE;
/*!40000 ALTER TABLE `application_statuses` DISABLE KEYS */;
INSERT INTO `application_statuses` VALUES (1,1,'offer recieved','#b0aa03',1,'2026-11-13 04:14:24'),(2,1,'visa applied ','#16bd00',1,'2026-11-13 04:14:37'),(3,1,'visa approved ','#5a8a00',1,'2026-11-13 04:14:45'),(4,1,'enrolled','#005ec2',1,'2026-11-13 04:14:52');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (2,1,'New Zealand','test','ca',1,1,4,'',NULL,'2026-11-13 08:11:42','2026-11-13 08:11:42',6);
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
INSERT INTO `branches` VALUES (1,'ufs',NULL,NULL,NULL,'2026-11-13 04:11:20','2026-11-13 04:11:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_history`
--

LOCK TABLES `contact_history` WRITE;
/*!40000 ALTER TABLE `contact_history` DISABLE KEYS */;
INSERT INTO `contact_history` VALUES (1,1,1,70,'follow_up_date','2026-11-13',NULL,'2026-11-12 12:16:18'),(2,1,1,70,'follow_up_date',NULL,'2026-11-13','2026-11-13 04:12:32');
/*!40000 ALTER TABLE `contact_history` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,1,'Diya Patel 1','+919800000001','+91','lead_1@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'link','whatsapp','2026-11-11 10:20:14',502,'Suite #2, Business Tower, Sector 2',1,NULL,1,'ufs',1,'marketing',2,'lost',3,'2026-11-13',1,0,NULL,NULL,1,'2026-11-13 09:42:33',502,NULL,'[70, \"502\"]','Medium',NULL,2),(2,1,'Rohan Verma 2','+919800000002','+91','lead_2@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'whatsapp','whatsapp','2026-11-10 10:20:14',70,'Suite #3, Business Tower, Sector 3',NULL,NULL,NULL,'South Branch',NULL,'Operations',NULL,'In Progress',2,'2026-11-14',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0),(3,1,'Ananya Nair 3','+919800000003','+91','lead_3@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'import','whatsapp','2026-11-09 10:20:14',70,'Suite #4, Business Tower, Sector 4',NULL,NULL,NULL,'Head Office',NULL,'Marketing',NULL,'Follow Up',3,'2026-11-15',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'High',NULL,0),(4,1,'Vikram Kumar dev','+919800000004','+91','lead_4@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'manual','whatsapp','2026-11-08 10:20:14',131,'Suite #5, Business Tower, Sector 5',NULL,NULL,1,'ufs',1,'marketing',3,'pending',5,'2026-11-16',1,0,NULL,NULL,0,NULL,NULL,NULL,'[70, \"131\"]','Medium',NULL,0),(5,1,'Pooja Singh 5','+919800000005','+91','lead_5@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'link','whatsapp','2026-11-07 10:20:14',70,'Suite #6, Business Tower, Sector 6',NULL,NULL,NULL,'South Branch',NULL,'Support',NULL,'New',0,'2026-11-17',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0),(6,1,'Rahul Reddy 6','+919800000006','+91','lead_6@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'whatsapp','whatsapp','2026-11-06 10:20:14',132,'Suite #7, Business Tower, Sector 7',NULL,NULL,1,'ufs',1,'marketing',3,'pending',2,'2026-11-18',1,0,NULL,NULL,0,NULL,NULL,NULL,'[70, \"132\"]','High',NULL,0),(7,1,'Sneha Mehta 7','+919800000007','+91','lead_7@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'import','whatsapp','2026-11-05 10:20:14',70,'Suite #8, Business Tower, Sector 8',NULL,NULL,NULL,'North Branch',NULL,'Marketing',NULL,'In Progress',2,'2026-11-19',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Medium',NULL,0),(8,1,'Arjun Sharma 8','+919800000008','+91','lead_8@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'manual','whatsapp','2026-11-04 10:20:14',70,'Suite #9, Business Tower, Sector 9',NULL,NULL,NULL,'South Branch',NULL,'Sales',NULL,'Follow Up',3,'2026-11-20',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0),(9,1,'Kavya Patel 9','+919800000009','+91','lead_9@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'link','whatsapp','2026-11-03 10:20:14',70,'Suite #10, Business Tower, Sector 10',NULL,NULL,NULL,'Head Office',NULL,'Support',NULL,'Qualified',4,'2026-11-21',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'High',NULL,0),(10,1,'Aarav Verma 10','+919800000010','+91','lead_10@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'whatsapp','whatsapp','2026-11-02 10:20:14',70,'Suite #11, Business Tower, Sector 11',NULL,NULL,NULL,'North Branch',NULL,'Operations',NULL,'New',0,'2026-11-22',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Medium',NULL,0),(11,1,'Diya Nair 11','+919800000011','+91','lead_11@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'import','whatsapp','2026-11-01 10:20:14',70,'Suite #12, Business Tower, Sector 12',NULL,NULL,NULL,'South Branch',NULL,'Marketing',NULL,'Contacted',1,'2026-11-23',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0),(12,1,'Rohan Kumar 12','+919800000012','+91','lead_12@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'manual','whatsapp','2026-10-31 10:20:14',70,'Suite #13, Business Tower, Sector 13',NULL,NULL,NULL,'Head Office',NULL,'Sales',NULL,'In Progress',2,'2026-11-24',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'High',NULL,0),(13,1,'Ananya Singh 13','+919800000013','+91','lead_13@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'link','whatsapp','2026-10-30 10:20:14',70,'Suite #14, Business Tower, Sector 14',NULL,NULL,NULL,'North Branch',NULL,'Support',NULL,'Follow Up',3,'2026-11-25',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Medium',NULL,0),(14,1,'Vikram Reddy 14','+919800000014','+91','lead_14@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'whatsapp','whatsapp','2026-10-29 10:20:14',70,'Suite #15, Business Tower, Sector 15',NULL,NULL,NULL,'South Branch',NULL,'Operations',NULL,'Qualified',4,'2026-11-12',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0),(15,1,'Pooja Mehta 15','+919800000015','+91','lead_15@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'import','whatsapp','2026-10-28 10:20:14',70,'Suite #16, Business Tower, Sector 16',NULL,NULL,NULL,'Head Office',NULL,'Marketing',NULL,'New',0,'2026-11-13',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'High',NULL,0),(16,1,'Rahul Sharma 16','+919800000016','+91','lead_16@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'manual','whatsapp','2026-10-27 10:20:14',70,'Suite #17, Business Tower, Sector 17',NULL,NULL,NULL,'North Branch',NULL,'Sales',NULL,'Contacted',1,'2026-11-14',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Medium',NULL,0),(17,1,'Sneha Patel 17','+919800000017','+91','lead_17@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'link','whatsapp','2026-10-26 10:20:14',70,'Suite #18, Business Tower, Sector 18',NULL,NULL,NULL,'South Branch',NULL,'Support',NULL,'In Progress',2,'2026-11-15',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0),(18,1,'Arjun Verma 18','+919800000018','+91','lead_18@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'whatsapp','whatsapp','2026-10-25 10:20:14',70,'Suite #19, Business Tower, Sector 19',NULL,NULL,NULL,'Head Office',NULL,'Operations',NULL,'Follow Up',3,'2026-11-16',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'High',NULL,0),(19,1,'Kavya Nair 19','+919800000019','+91','lead_19@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'import','whatsapp','2026-10-24 10:20:14',70,'Suite #20, Business Tower, Sector 20',NULL,NULL,NULL,'North Branch',NULL,'Marketing',NULL,'Qualified',4,'2026-11-17',0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Medium',NULL,0),(20,1,'Aarav Kumar 20','+919800000020','+91','lead_20@trackboxcrm.test','[\"New Lead\", \"Bulk Import\"]',1,'2026-11-12 10:20:14',NULL,'manual','whatsapp','2026-10-23 10:20:14',70,'Suite #21, Business Tower, Sector 21',NULL,NULL,NULL,'South Branch',NULL,'Sales',NULL,'New',0,'2026-11-18',1,0,NULL,NULL,0,NULL,NULL,NULL,NULL,'Low',NULL,0);
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
  `country_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `iso_code` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_length` int DEFAULT '10',
  `min_length` int DEFAULT '7',
  `max_length` int DEFAULT '15',
  `flag_emoji` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `is_default` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '100',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_country_iso` (`country_name`,`iso_code`),
  KEY `idx_code` (`country_code`),
  KEY `idx_iso` (`iso_code`),
  KEY `idx_sort` (`sort_order`,`country_name`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `country_codes`
--

LOCK TABLES `country_codes` WRITE;
/*!40000 ALTER TABLE `country_codes` DISABLE KEYS */;
INSERT INTO `country_codes` VALUES (1,'India','+91','IN',10,7,15,'??',1,1,'2026-11-12 12:07:48'),(2,'United States','+1','US',10,7,15,'??',0,2,'2026-11-12 12:07:48'),(3,'United Kingdom','+44','GB',10,7,15,'??',0,3,'2026-11-12 12:07:48'),(4,'Canada','+1','CA',10,7,15,'??',0,4,'2026-11-12 12:07:48'),(5,'Australia','+61','AU',9,7,15,'??',0,5,'2026-11-12 12:07:48'),(6,'New Zealand','+64','NZ',9,7,15,'??',0,6,'2026-11-12 12:07:48'),(7,'United Arab Emirates','+971','AE',9,7,15,'??',0,7,'2026-11-12 12:07:48'),(8,'Saudi Arabia','+966','SA',9,7,15,'??',0,8,'2026-11-12 12:07:48'),(9,'Singapore','+65','SG',8,7,15,'??',0,9,'2026-11-12 12:07:48'),(10,'Germany','+49','DE',10,7,15,'??',0,10,'2026-11-12 12:07:48'),(11,'Ireland','+353','IE',9,7,15,'??',0,11,'2026-11-12 12:07:48'),(12,'Malaysia','+60','MY',10,7,15,'??',0,12,'2026-11-12 12:07:48'),(13,'Qatar','+974','QA',8,7,15,'??',0,13,'2026-11-12 12:07:48'),(14,'Kuwait','+965','KW',8,7,15,'??',0,14,'2026-11-12 12:07:48'),(15,'Oman','+968','OM',8,7,15,'??',0,15,'2026-11-12 12:07:48'),(16,'Bahrain','+973','BH',8,7,15,'??',0,16,'2026-11-12 12:07:48'),(17,'Afghanistan','+93','AF',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(18,'Albania','+355','AL',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(19,'Algeria','+213','DZ',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(20,'Andorra','+376','AD',6,7,15,'??',0,100,'2026-11-12 12:07:48'),(21,'Angola','+244','AO',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(22,'Argentina','+54','AR',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(23,'Armenia','+374','AM',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(24,'Austria','+43','AT',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(25,'Azerbaijan','+994','AZ',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(26,'Bahamas','+1-242','BS',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(27,'Bangladesh','+880','BD',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(28,'Barbados','+1-246','BB',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(29,'Belarus','+375','BY',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(30,'Belgium','+32','BE',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(31,'Belize','+501','BZ',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(32,'Benin','+229','BJ',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(33,'Bhutan','+975','BT',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(34,'Bolivia','+591','BO',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(35,'Bosnia and Herzegovina','+387','BA',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(36,'Botswana','+267','BW',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(37,'Brazil','+55','BR',11,7,15,'??',0,100,'2026-11-12 12:07:48'),(38,'Brunei','+673','BN',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(39,'Bulgaria','+359','BG',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(40,'Burkina Faso','+226','BF',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(41,'Burundi','+257','BI',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(42,'Cambodia','+855','KH',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(43,'Cameroon','+237','CM',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(44,'Chile','+56','CL',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(45,'China','+86','CN',11,7,15,'??',0,100,'2026-11-12 12:07:48'),(46,'Colombia','+57','CO',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(47,'Congo','+242','CG',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(48,'Costa Rica','+506','CR',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(49,'Croatia','+385','HR',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(50,'Cuba','+53','CU',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(51,'Cyprus','+357','CY',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(52,'Czech Republic','+420','CZ',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(53,'Denmark','+45','DK',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(54,'Djibouti','+253','DJ',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(55,'Ecuador','+593','EC',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(56,'Egypt','+20','EG',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(57,'El Salvador','+503','SV',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(58,'Estonia','+372','EE',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(59,'Ethiopia','+251','ET',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(60,'Fiji','+679','FJ',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(61,'Finland','+358','FI',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(62,'France','+33','FR',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(63,'Georgia','+995','GE',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(64,'Ghana','+233','GH',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(65,'Greece','+30','GR',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(66,'Guatemala','+502','GT',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(67,'Hong Kong','+852','HK',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(68,'Hungary','+36','HU',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(69,'Iceland','+354','IS',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(70,'Indonesia','+62','ID',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(71,'Iran','+98','IR',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(72,'Iraq','+964','IQ',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(73,'Israel','+972','IL',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(74,'Italy','+39','IT',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(75,'Jamaica','+1-876','JM',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(76,'Japan','+81','JP',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(77,'Jordan','+962','JO',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(78,'Kazakhstan','+7','KZ',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(79,'Kenya','+254','KE',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(80,'Lebanon','+961','LB',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(81,'Libya','+218','LY',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(82,'Luxembourg','+352','LU',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(83,'Maldives','+960','MV',7,7,15,'??',0,100,'2026-11-12 12:07:48'),(84,'Mauritius','+230','MU',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(85,'Mexico','+52','MX',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(86,'Monaco','+377','MC',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(87,'Mongolia','+976','MN',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(88,'Morocco','+212','MA',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(89,'Myanmar','+95','MM',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(90,'Nepal','+977','NP',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(91,'Netherlands','+31','NL',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(92,'Nigeria','+234','NG',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(93,'Norway','+47','NO',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(94,'Pakistan','+92','PK',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(95,'Panama','+507','PA',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(96,'Peru','+51','PE',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(97,'Philippines','+63','PH',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(98,'Poland','+48','PL',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(99,'Portugal','+351','PT',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(100,'Romania','+40','RO',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(101,'Russia','+7','RU',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(102,'Rwanda','+250','RW',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(103,'Serbia','+381','RS',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(104,'South Africa','+27','ZA',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(105,'South Korea','+82','KR',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(106,'Spain','+34','ES',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(107,'Sri Lanka','+94','LK',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(108,'Sweden','+46','SE',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(109,'Switzerland','+41','CH',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(110,'Taiwan','+886','TW',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(111,'Tanzania','+255','TZ',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(112,'Thailand','+66','TH',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(113,'Turkey','+90','TR',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(114,'Uganda','+256','UG',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(115,'Ukraine','+380','UA',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(116,'Uruguay','+598','UY',8,7,15,'??',0,100,'2026-11-12 12:07:48'),(117,'Uzbekistan','+998','UZ',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(118,'Venezuela','+58','VE',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(119,'Vietnam','+84','VN',10,7,15,'??',0,100,'2026-11-12 12:07:48'),(120,'Yemen','+967','YE',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(121,'Zambia','+260','ZM',9,7,15,'??',0,100,'2026-11-12 12:07:48'),(122,'Zimbabwe','+263','ZW',9,7,15,'??',0,100,'2026-11-12 12:07:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'ca',25000.00,'7',NULL,'2026-11-13 04:14:08','2026-11-13 04:14:08');
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
INSERT INTO `departments` VALUES (1,1,'marketing',NULL,'2026-11-13 04:11:30','2026-11-13 04:11:30');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiry_fors`
--

LOCK TABLES `enquiry_fors` WRITE;
/*!40000 ALTER TABLE `enquiry_fors` DISABLE KEYS */;
INSERT INTO `enquiry_fors` VALUES (1,1,'Education','2026-11-12 10:55:26'),(2,1,'PTE','2026-11-12 10:55:34');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
INSERT INTO `follow_ups` VALUES (1,1,'Diya Patel 1',NULL,'2026-11-12 17:46:18',70,'Administrator',70,'Administrator',NULL,'Contacted',NULL,'North Branch',NULL,'Support',''),(3,1,'Diya Patel 1','2026-11-13','2026-11-13 09:42:32',70,'Administrator',502,'Priya Sharma',2,'lost',1,'ufs',1,'marketing','newww '),(4,4,'Vikram Kumar dev','2026-11-16','2026-11-13 09:48:48',70,'Administrator',131,'Rahul Menon',3,'pending',1,'ufs',1,'marketing',''),(5,6,'Rahul Reddy 6','2026-11-18','2026-11-13 13:40:50',70,'Administrator',132,'Deepa Nair',3,'pending',1,'ufs',1,'marketing','');
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intakes`
--

LOCK TABLES `intakes` WRITE;
/*!40000 ALTER TABLE `intakes` DISABLE KEYS */;
INSERT INTO `intakes` VALUES (1,1,'2026',1,'2026-11-13 04:53:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,502,'assignment','Contact Reassigned','A contact has been assigned to you: Diya Patel 1',1,0,'2026-11-13 04:12:32'),(2,1,131,'assignment','Contact Reassigned','A contact has been assigned to you: Vikram Kumar dev',4,0,'2026-11-13 04:18:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_types`
--

LOCK TABLES `receipt_types` WRITE;
/*!40000 ALTER TABLE `receipt_types` DISABLE KEYS */;
INSERT INTO `receipt_types` VALUES (1,1,'application fees','2026-11-13 04:35:19'),(2,1,'registration fees','2026-11-13 04:35:30');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
INSERT INTO `receipts` VALUES (1,1,1,1,'application fees',1323.00,'2026-11-13','paid',70,'Administrator','2026-11-13 07:50:01'),(2,4,1,2,'registration fees',567890.00,'2026-11-13',NULL,70,'Administrator','2026-11-13 07:50:16'),(3,6,1,1,'application fees',123.00,'2026-11-13','2',132,'Deepa Nair','2026-11-13 08:11:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (1,'won','Yes','#11ff00',0,'2026-11-13 04:09:51','2026-11-13 04:10:51',1,NULL,'sale'),(2,'lost','Yes','#ff0000',0,'2026-11-13 04:10:02','2026-11-13 04:10:58',1,NULL,'sale_lost'),(3,'pending','Yes','#ff0059',0,'2026-11-13 04:10:10','2026-11-13 04:10:43',1,NULL,NULL),(4,'no follow up','No','#ff0000',0,'2026-11-13 04:10:25','2026-11-13 04:10:34',0,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES (7,3,502,'2026-11-13 07:46:18'),(8,3,131,'2026-11-13 07:46:18'),(9,3,132,'2026-11-13 07:46:18');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (3,1,502,NULL,'2026-11-13 07:46:18');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `universities`
--

LOCK TABLES `universities` WRITE;
/*!40000 ALTER TABLE `universities` DISABLE KEYS */;
INSERT INTO `universities` VALUES (1,'test','New Zealand','AMBALAPPUZHA',NULL,NULL,'2026-11-13 04:13:50','2026-11-13 04:13:50');
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
INSERT INTO `users` VALUES (70,1,NULL,NULL,'Administrator','admin@trackbox.com',NULL,'$2b$10$YLMl/gnBCALernNeRSly0OVKF3moUzJIz0xG9K0Q.mMfPLzK1t1pm','admin',1,'2026-11-11 07:08:03','admin','active',NULL,NULL,NULL,NULL,NULL,0,NULL),(71,1,NULL,NULL,'UFS Developer','ufs@trackbox.com',NULL,'$2b$10$YLMl/gnBCALernNeRSly0OVKF3moUzJIz0xG9K0Q.mMfPLzK1t1pm','superadmin',1,'2026-11-11 07:08:03','ufs','active',NULL,NULL,NULL,NULL,NULL,1,NULL),(131,1,1,1,'Rahul Menon','rahul.menon@trackboxcrm.com','8129025108',NULL,'agent',1,'2026-11-11 07:50:21','rahul_uk','active',121,'UK-01',NULL,NULL,'[]',0,NULL),(132,1,1,1,'Deepa Nair','deepa.nair@trackboxcrm.com',NULL,'$2b$10$FSy1q0DNQHMdw.zInrZLY./JZ0YcyoPHXCzBV4Yd9IAT3VysOJH5G','agent',1,'2026-11-11 07:50:21','deepa_uk','active',122,'UK-02',NULL,NULL,'[]',0,NULL),(502,1,1,1,'Priya Sharma','priya.sharma@trackboxcrm.com','8129025765','$2b$10$1234567890abcdefghijklmnop','manager',1,'2026-11-11 07:49:27','priya_canada','active',402,'EMP-CAN-02','2024-09-01',NULL,'[]',0,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `years`
--

LOCK TABLES `years` WRITE;
/*!40000 ALTER TABLE `years` DISABLE KEYS */;
INSERT INTO `years` VALUES (1,'2026',1);
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

-- Dump completed on 2026-11-13 14:29:58
