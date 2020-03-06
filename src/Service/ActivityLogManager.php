<?php

namespace App\Service;

use App\Entity\ActivityLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * The activity log manager.
 *
 * This service handles the main business logic related to activity logs.
 */
class ActivityLogManager
{
  /**
   * @var EntityManagerInterface
   */
  private $entityManager;

  /**
   * Constructor function.
   *
   * @param EntityManagerInterface $entityManager
   */
  public function __construct(EntityManagerInterface $entityManager)
  {
    $this->entityManager = $entityManager;
  }

  /**
   * Create an activity log.
   *
   * @param User $user
   * @param string $action
   * @param mixed $entity1
   * @param mixed $entity2
   */
  public function create(User $user, string $action, $entity1 = null, $entity2 = null)
  {
    $activityLog = new ActivityLog($user, $action, $entity1, $entity2);
    $this->entityManager->persist($activityLog);
    $this->entityManager->flush();
  }
}
