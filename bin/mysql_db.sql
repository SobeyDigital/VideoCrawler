DROP TABLE IF EXISTS `fetch_job`;
CREATE TABLE `fetch_job` (
  `jobid` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `status` tinyint(1) DEFAULT '0',
  `url` varchar(1024) COLLATE utf8_unicode_ci DEFAULT NULL,
  `client` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  `callback` varchar(1024) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createtime` datetime DEFAULT NULL,
  `updatetime` datetime DEFAULT NULL,
  `message` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL,
  `result` text COLLATE utf8_unicode_ci,
  `notifystatus` tinyint(1) DEFAULT NULL,
  `notifydesc` varchar(2048) COLLATE utf8_unicode_ci DEFAULT NULL,
  `notifytime` datetime DEFAULT NULL,
  PRIMARY KEY (`jobid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

DROP TABLE IF EXISTS `fetch_max_count`;
CREATE TABLE `fetch_max_count` (
  `pid` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `cur_count` int(3) DEFAULT NULL,
  `total_count` int(3) DEFAULT NULL,
  `init` bigint(20) DEFAULT NULL,
  `type` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`pid`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `fetch_job` ADD COLUMN `type` VARCHAR(20) NULL;