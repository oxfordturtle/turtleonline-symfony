<?php

namespace App\Model;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Model for the email credentials form type.
 */
class EmailCredentials
{
  /**
   * The email address.
   *
   * @var string
   * @Assert\NotBlank(message="Email address cannot be blank.")
   * @Assert\Email(message="This is not a valid email address.")
   */
  private $email;

  /**
   * Get the email address.
   *
   * @return string|null
   */
  public function getEmail(): ?string
  {
    return $this->email;
  }

  /**
   * Set the email address.
   *
   * @param string
   * @return self
   */
  public function setEmail(string $email): self
  {
    $this->email = $email;
    return $this;
  }
}
