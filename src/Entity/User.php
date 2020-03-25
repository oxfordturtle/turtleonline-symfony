<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * A user registered on the site.
 *
 * @ORM\Entity
 * @UniqueEntity(
 *   fields="email",
 *   message="This email address is already taken.",
 *   groups={"edit", "register"}
 * )
 * @UniqueEntity(
 *   fields="username",
 *   message="This username is already taken.",
 *   groups={"edit", "register"}
 * )
 */
class User implements UserInterface
{
  /**
   * The user's unique identifier in the database.
   *
   * @var int
   * @ORM\Column(type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="AUTO")
   */
  private $id;

  /**
   * The user's (unique) username.
   *
   * @var string
   * @ORM\Column(type="string", length=255, unique=true)
   * @Assert\NotBlank(message="Username cannot be blank.")
   * @Assert\NotIdenticalTo(value="admin", message="This username is already taken.")
   */
  private $username;

  /**
   * The user's (unique) email address.
   *
   * @var string
   * @ORM\Column(type="string", length=255, unique=true)
   * @Assert\NotBlank(message="Email address cannot be blank.")
   * @Assert\Email(message="This is not a valid email address.")
   */
  private $email;

  /**
   * Whether the user has admin privileges.
   *
   * @var bool
   * @ORM\Column(type="boolean")
   */
  private $admin;

  /**
   * Whether the user has verified their email address.
   *
   * @var bool
   * @ORM\Column(type="boolean")
   */
  private $verified;

  /**
   * The user's password (encoded).
   *
   * @var string
   * @ORM\Column(type="string", length=255)
   * @Assert\NotBlank(message="Password cannot be blank", groups={"registration"})
   */
  private $password;

  /**
   * Date the user last logged in.
   *
   * @var \DateTimeInterface|null
   * @ORM\Column(type="date", nullable=true)
   */
  private $lastLoginDate;

  /**
   * The user's verification token.
   *
   * @var string|null
   * @ORM\Column(type="string", length=255, nullable=true)
   */
  private $token;

  /**
   * Date the user's verification token was created.
   *
   * @var \DateTimeInterface|null
   * @ORM\Column(type="date", nullable=true)
   */
  private $tokenDate;

  /**
   * The user's firstname.
   *
   * @var string
   * @ORM\Column(type="string", length=255)
   * @Assert\NotBlank(message="First name cannot be blank.")
   */
  private $firstname;

  /**
   * The user's surname.
   *
   * @var string
   * @ORM\Column(type="string", length=255)
   * @Assert\NotBlank(message="Surname cannot be blank.")
   */
  private $surname;

  /**
   * The user's school name.
   *
   * @var string|null
   * @ORM\Column(type="string", length=255, nullable=true)
   */
  private $schoolName;

  /**
   * The user's school post code.
   *
   * @var string|null
   * @ORM\Column(type="string", length=255, nullable=true)
   */
  private $schoolPostcode;

  /**
   * Whether the user is over 13.
   *
   * @var bool
   * @ORM\Column(type="boolean")
   */
  private $over13;

  /**
   * Name of the user's parent/guardian (if under 13).
   *
   * @var string|null
   * @ORM\Column(type="string", length=255, nullable=true)
   */
  private $guardianFullname;

  /**
   * Whether the user wishes to receive emails.
   *
   * @var bool
   * @ORM\Column(type="boolean")
   */
  private $receivingEmails;

  /**
   * The user's activity logs.
   *
   * @var ActivityLog[]
   * @ORM\OneToMany(targetEntity="App\Entity\ActivityLog", mappedBy="user")
   * @ORM\OrderBy({"date"="ASC"})
   */
  private $logs;

  /**
   * Constructor function.
   */
  public function __construct()
  {
    $this->id = null;
    $this->username = null;
    $this->email = null;
    $this->admin = false;
    $this->verified = false;
    $this->password = null;
    $this->lastLoginDate = null;
    $this->token = null;
    $this->tokenDate = null;
    $this->firstname = null;
    $this->surname = null;
    $this->schoolName = null;
    $this->schoolPostcode = null;
    $this->over13 = true;
    $this->guardianFullname = null;
    $this->receivingEmails = true;
    $this->logs = new ArrayCollection();
  }

  /**
   * Get the user's unique identifier.
   *
   * @return int|null
   */
  public function getId(): ?int
  {
    return $this->id;
  }

  /**
   * Get the user's username.
   *
   * @return string|null
   */
  public function getUsername(): ?string
  {
    return $this->username;
  }

  /**
   * Set the user's username.
   *
   * @param string $username
   * @return self
   */
  public function setUsername(string $username): self
  {
    $this->username = $username;
    return $this;
  }

  /**
   * Get the user's email.
   *
   * @return string|null
   */
  public function getEmail(): ?string
  {
    return $this->email;
  }

  /**
   * Set the user's email.
   *
   * @param string $email
   * @return self
   */
  public function setEmail(string $email): self
  {
    $this->email = $email;
    return $this;
  }

  /**
   * Get whether the user has verified their email address.
   *
   * @return bool
   */
  public function isVerified(): bool
  {
    return $this->verified;
  }

  /**
   * Set whether the user has verified their email address.
   *
   * @param bool $verified
   * @return self
   */
  public function setVerified(bool $verified): self
  {
    $this->verified = $verified;
    return $this;
  }

  /**
   * Get the user's password.
   *
   * @return string|null
   */
  public function getPassword(): ?string
  {
    return $this->password;
  }

  /**
   * Set the user's password.
   *
   * @param string $password
   * @return self
   */
  public function setPassword(string $password): self
  {
    $this->password = $password;
    return $this;
  }

  /**
   * Get the user's last login date.
   *
   * @return \DateTimeInterface|null
   */
  public function getLastLoginDate(): ?\DateTimeInterface
  {
    return $this->lastLoginDate;
  }

  /**
   * Set the user's last login date.
   *
   * @param \DateTimeInterface $lastLoginDate
   * @return self
   */
  public function setLastLoginDate(\DateTimeInterface $lastLoginDate): self
  {
    $this->lastLoginDate = $lastLoginDate;
    return $this;
  }

  /**
   * Get the user's verification token.
   *
   * @return string|null
   */
  public function getToken(): ?string
  {
    return $this->token;
  }

  /**
   * Set the user's verification token.
   *
   * @return self
   */
  public function setToken(string $token): self
  {
    $this->token = $token;
    return $this;
  }

  /**
   * Get the date the user's verification token was created.
   *
   * @return \DateTimeInterface|null
   */
  public function getTokenDate(): ?\DateTimeInterface
  {
    return $this->tokenDate;
  }

  /**
   * Set the date the user's verification token was created.
   *
   * @param \DateTimeInterface $tokenDate
   * @return self
   */
  public function setTokenDate(\DateTimeInterface $tokenDate): self
  {
    $this->tokenDate = $tokenDate;
    return $this;
  }

  /**
   * Get the user's firstname.
   *
   * @return string|null
   */
  public function getFirstname(): ?string
  {
    return $this->firstname;
  }

  /**
   * Set the user's firstname.
   *
   * @param string $firstname
   * @return self
   */
  public function setFirstname(string $firstname): self
  {
    $this->firstname = $firstname;
    return $this;
  }

  /**
   * Get the user's surname.
   *
   * @return string|null
   */
  public function getSurname(): ?string
  {
    return $this->surname;
  }

  /**
   * Set the user's surname.
   *
   * @param string $surname
   * @return self
   */
  public function setSurname(string $surname): self
  {
    $this->surname = $surname;
    return $this;
  }

  /**
   * Get the user's school name.
   *
   * @return string|null
   */
  public function getSchoolName(): ?string
  {
    return $this->schoolName;
  }

  /**
   * Set the user's school name.
   *
   * @param string $schoolName
   * @return self
   */
  public function setSchoolName(?string $schoolName): self
  {
    $this->schoolName = $schoolName;
    return $this;
  }

  /**
   * Get the user's school postcode.
   *
   * @return string|null
   */
  public function getSchoolPostcode(): ?string
  {
    return $this->schoolPostcode;
  }

  /**
   * Set the user's school postcode.
   *
   * @param string $schoolPostcode
   * @return self
   */
  public function setSchoolPostcode(?string $schoolPostcode): self
  {
    $this->schoolPostcode = $schoolPostcode;
    return $this;
  }

  /**
   * Get whether the user is over 13.
   *
   * @return bool
   */
  public function isOver13(): bool
  {
    return $this->over13;
  }

  /**
   * Set whether the user is over 13.
   *
   * @param bool $over13
   * @return self
   */
  public function setOver13(bool $over13): self
  {
    $this->over13 = $over13;
    return $this;
  }

  /**
   * Get whether the user wants to receive emails.
   *
   * @return bool
   */
  public function isReceivingEmails(): bool
  {
    return $this->receivingEmails;
  }

  /**
   * Set whether the user wants to receive emails.
   *
   * @param bool $receivingEmails
   * @return self
   */
  public function setReceivingEmails(bool $receivingEmails): self
  {
    $this->receivingEmails = $receivingEmails;
    return $this;
  }

  /**
   * Get the user's guardian's fullname.
   *
   * @return string|null
   */
  public function getGuardianFullname(): ?string
  {
    return $this->guardianFullname;
  }

  /**
   * Set the user's guardian's fullname.
   *
   * @param string $guardianFullname
   * @return self
   */
  public function setGuardianFullname(?string $guardianFullname): self
  {
    $this->guardianFullname = $guardianFullname;
    return $this;
  }

  /**
   * Get activity logs.
   *
   * @return ActivityLog[]
   */
  public function getLogs(): Collection
  {
    return $this->logs;
  }

  /**
   * Get salt (needed by the Symfony security component).
   */
  public function getSalt()
  {
  }

  /**
   * Get roles (needed by the Symfony security component).
   */
  public function getRoles(): array
  {
    $roles = ['ROLE_USER'];
    if ($this->admin) {
      $roles[] = 'ROLE_ADMIN';
    }
    if ($this->verified) {
      $roles[] = 'ROLE_VERIFIED';
    }
    return $roles;
  }

  /**
   * Erase credentials (needed by the Symfony security component).
   */
  public function eraseCredentials()
  {
  }
}
