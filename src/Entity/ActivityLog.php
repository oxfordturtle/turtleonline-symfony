<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * A record of some user activity.
 *
 * @ORM\Entity
 */
class ActivityLog
{
  /**
   * The log's unique identifier in the database.
   *
   * @var int
   * @ORM\Column(type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="AUTO")
   */
  private $id;

  /**
   * The user whose activity is being logged.
   *
   * @var User
   * @ORM\ManyToOne(targetEntity="App\Entity\User", inversedBy="logs")
   */
  private $user;

  /**
   * The label of the activity being logged.
   *
   * @var string
   * @ORM\Column(type="string", length=255)
   */
  private $action;

  /**
   * The date and time of the activity.
   *
   * @var \DateTimeInterface
   * @ORM\Column(type="datetime")
   */
  private $date;

  /**
   * Constructor function.
   *
   * @param User $user
   * @param string $action
   */
  public function __construct(User $user, string $action)
  {
    $this->id = null;
    $this->user = $user;
    $this->action = $action;
    $this->date = new \DateTime('now');
  }

  /**
   * Get the log's unique identifier (null when the object is first created).
   *
   * @return int|null
   */
  public function getId(): ?int
  {
    return $this->id;
  }

  /**
   * Get the user.
   *
   * @return User
   */
  public function getUser(): User
  {
    return $this->user;
  }

  /**
   * Get the label of the activity.
   *
   * @return string
   */
  public function getAction(): string
  {
    return $this->action;
  }

  /**
   * Get the date and time of the activity.
   *
   * @return \DateTimeInterface
   */
  public function getDate(): \DateTimeInterface
  {
    return $this->date;
  }
}
