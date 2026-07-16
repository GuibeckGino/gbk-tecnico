CREATE TABLE `installations` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`cliente` text NOT NULL,
	`endereco` text NOT NULL,
	`bairro` varchar(255),
	`tipoServico` enum('Instalação','Tipo 3','Mudança','Empresarial') NOT NULL,
	`valor` int NOT NULL,
	`data` varchar(10) NOT NULL,
	`observacoes` text,
	`isFavorito` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `syncLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`table` varchar(64) NOT NULL,
	`recordId` varchar(64) NOT NULL,
	`data` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `syncLog_id` PRIMARY KEY(`id`)
);
